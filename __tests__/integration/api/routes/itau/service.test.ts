import path from 'path'
import fs from 'fs'
import https from 'https'
import qs from 'qs'
import axios, { AxiosResponse } from 'axios';
import { authenticateTokenItau, createCharge, findOne, getAgent } from '~/api/routes/itau/service';

jest.mock('fs')
jest.mock('qs')
jest.mock('https')
jest.mock('axios')
jest.mock('~/common/logger')

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockAxiosFunc = axios as jest.MockedFunction<typeof axios>;
const mockCertPath = path.join(__dirname, '..', '..', '..', '..', '..', 'certs', 'mock-cert.pem')
const mockCertData = 'mock-certificate-data'
const mockPayload = {
    calendario: {
        expiracao: 8640000
    },
    devedor: {
        cpf: '12345678000195',
        nome: 'PMD HOBISSOM EDERLAN EINS'
    },
    valor: {
        original: "567.89"
    },
    chave: "04071299000126",
    solicitacaoPagador: "Informar cartão fidelidade"
}
const mockData = {
    "calendario": {
        "criacao": "2023-01-01T00:00:00Z",
        "expiracao": 3600
    },
    "txid": "7978c0c97ea847e78e8849634473c1f1",
    "revisao": 0,
    "loc": {
        "id": 789,
        "location": "pix.example.com/pix/qr/v2/c8cff0b5-5b2f-4154-835f-14ede94a2afc",
        "tipoCob": "cob",
        "criacao": "2023-01-01T00:00:00Z"
    },
    "location": "pix.example.com/pix/qr/v2/c8cff0b5-5b2f-4154-835f-14ede94a2afc",
    "status": "ATIVA",
    "devedor": {
        "cnpj": "12345678000195",
        "nome": "PMD HOBISSOM EDERLAN EINS"
    },
    "valor": {
        "original": "567.89",
        "modalidadeAlteracao": 1
    },
    "chave": "a1f4102e-a446-4a57-bcce-6fa48899c1d1",
    "pixCopiaECola": "00020101021226840014BR.GOV.BCB.PIX2562pix.example.com/pix/qr/v2/c8cff0b5-5b2f-4154-835f-14ede94a2afc5204000053039865802BR5925PMD HOBISSOM EDERLAN EINS6009SAO PAULO62070503***6304D56E",
    "solicitacaoPagador": "Informar cartão fidelidade",
    "infoAdicionais": [
        {
            "nome": "Campo 1",
            "valor": "Informação Adicional 1 do PSP-Recebedor"
        },
        {
            "nome": "Campo 2",
            "valor": "Informação Adicional 2 do PSP-Recebedor"
        }
    ]
}

describe('getAgent', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should return an https.Agent instance when certificate is found', () => {
        process.env.ITAU_CERT = 'mock-cert.pem';
        (fs.readFileSync as jest.Mock).mockReturnValue(mockCertData)
        const mockAgent = { ca: mockCertData };
        (https.Agent as jest.Mock).mockReturnValue(mockAgent)

        const agent = getAgent()

        expect(fs.readFileSync).toHaveBeenCalledWith(mockCertPath)
        expect(https.Agent).toHaveBeenCalledWith({ ca: mockCertData })
        expect(agent).toEqual({ ca: mockCertData })
    })

    it('should throw an error when ITAU_CERT is not defined', () => {
        process.env.ITAU_CERT = ''

        expect(() => getAgent()).toThrow('Certificate not found')
    })
})

describe('createCharge', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw an error on failed request', async () => {
        const mockToken = 'Basic MWUyZDUzZGYtNjE0ZS0zZGEzLTkxZjQtZTYyZTgwZGUwZjUyOmNlMGU5ZjZlLTMwYjAtNDkxMC05MWI3LTQ0Njk0NjAwZDBhNw==';
        const mockErro: AxiosResponse<any> = {
            data: mockData,
            status: 500,
            statusText: 'Unknown error',
            headers: {},
            config: {}
        };
        (fs.readFileSync as jest.Mock).mockReturnValue('mock-cert-data');
        mockAxios.post.mockResolvedValueOnce(mockErro)
        await expect(createCharge(mockToken, mockPayload)).rejects.toThrow('Impossible to continue: Unknown error');
    });

    it('should return data on successful request', async () => {
        jest.clearAllMocks();
        const mockToken = 'Basic MWUyZDUzZGYtNjE0ZS0zZGEzLTkxZjQtZTYyZTgwZGUwZjUyOmNlMGU5ZjZlLTMwYjAtNDkxMC05MWI3LTQ0Njk0NjAwZDBhNw==';

        const mockResponse: AxiosResponse<any> = {
            data: mockData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {
                url: `${process.env.ITAU_ENDPOINT}/v2/cob/`
            }
        };

        process.env.ITAU_CERT = 'mock-cert.pem';
        (fs.readFileSync as jest.Mock).mockReturnValue(mockCertData)
        const mockAgent = { ca: mockCertData };
        (https.Agent as jest.Mock).mockReturnValue(mockAgent)
        mockAxiosFunc.mockResolvedValueOnce(mockResponse)

        const result = await createCharge(mockToken, mockPayload);

        expect(result).toEqual(mockData);
        expect(mockAxios).toHaveBeenCalledWith({
            method: 'post',
            url: `${process.env.ITAU_ENDPOINT}/v2/cob/`,
            headers: { Authorization: mockToken },
            httpsAgent: { ca: mockCertData },
            data: mockPayload
        });
    });
});

describe('authenticateTokenItau', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockclientInfo = {
        clientID: '1e2d53df-614e-3da3-91f4-e62e80de0f52',
        clientSecret: 'ce0e9f6e-30b0-4910-91b7-44694600d0a7'
    };

    it('should return data on successful request', async () => {
        const mockToken = 'Basic MWUyZDUzZGYtNjE0ZS0zZGEzLTkxZjQtZTYyZTgwZGUwZjUyOmNlMGU5ZjZlLTMwYjAtNDkxMC05MWI3LTQ0Njk0NjAwZDBhNw==';
        process.env.ITAU_CERT = 'mock-cert.pem';

        const mockResponse: AxiosResponse<any> = {
            data: mockData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        };

        jest.spyOn(fs, 'readFileSync').mockReturnValue(mockCertData);
        mockAxiosFunc.mockResolvedValueOnce(mockResponse)
        jest.spyOn(https, 'Agent').mockImplementation(() => ({ ca: mockCertData } as unknown as https.Agent));

        const result = await authenticateTokenItau(mockclientInfo);

        expect(result).toEqual(mockData);
        expect(mockAxios).toHaveBeenCalledWith({
            method: 'post',
            url: `${process.env.ITAU_ENDPOINT}/oauth/token`,
            headers: {
                Authorization: mockToken,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            httpsAgent: { ca: mockCertData }
        });
    });

    it('should throw an error on failed request', async () => {
        const mockclientInfo = {
            clientID: '1e2d53df-614e-3da3-91f4-e62e80de0f52',
            clientSecret: 'ce0e9f6e-30b0-4910-91b7-44694600d0a7'
        };
        const mockErro: AxiosResponse<any> = {
            data: mockData,
            status: 500,
            statusText: 'Unknown error',
            headers: {},
            config: {}
        };
        jest.spyOn(fs, 'readFileSync').mockReturnValue(mockCertData);
        jest.spyOn(https, 'Agent').mockImplementation(() => ({ ca: mockCertData } as unknown as https.Agent));
        mockAxios.post.mockRejectedValueOnce(mockErro)
        await expect(authenticateTokenItau(mockclientInfo)).rejects.toThrow('Impossible to validate credentials: Unknown error');
    });
});

describe('findOne', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockToken = 'Basic MWUyZDUzZGYtNjE0ZS0zZGEzLTkxZjQtZTYyZTgwZGUwZjUyOmNlMGU5ZjZlLTMwYjAtNDkxMC05MWI3LTQ0Njk0NjAwZDBhNw==';
    const mockID = '53d8faa8f5f943c7a660ba7c98b4c1a3';
    it('should throw an error on failed request', async () => {
        const mockErro: AxiosResponse<any> = {
            data: mockData,
            status: 500,
            statusText: 'Unknown error',
            headers: {},
            config: {}
        };
        (fs.readFileSync as jest.Mock).mockReturnValue('mock-cert-data');
        mockAxios.post.mockResolvedValueOnce(mockErro)
        await expect(findOne(mockToken, mockID)).rejects.toThrow('Impossible to continue: Unknown error');
    });

    it('should return data on successful request', async () => {
        process.env.ITAU_CERT = 'mock-cert.pem';

        const mockResponse: AxiosResponse<any> = {
            data: {
                status: 'CONCLUIDA'
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {}
        };

        jest.spyOn(fs, 'readFileSync').mockReturnValue(mockCertData);
        mockAxiosFunc.mockResolvedValueOnce(mockResponse)
        jest.spyOn(https, 'Agent').mockImplementation(() => ({ ca: mockCertData } as unknown as https.Agent));

        const result = await findOne(mockToken, mockID);

        expect(result).toEqual(mockResponse.data);
    });
});
