import request from 'supertest'
import { createExpressServer } from 'routing-controllers'
import { ItauController, ItauTokenController } from '~/api/routes/itau/controller'
import { authenticateTokenItau, createCharge, findOne } from '~/api/routes/itau/service'
import bodyParser from 'body-parser'
import { AxiosError } from 'axios'

jest.mock('~/api/routes/itau/service')

const serverToken = createExpressServer({
    controllers: [ItauTokenController],
    middlewares: [bodyParser.json()],
})

const server = createExpressServer({
    controllers: [ItauController],
    middlewares: [bodyParser.json()],
})

interface AxiosResponse<T> {
    data: T,
    status: number,
    statusText: string,
    headers: any,
    config: any,
}

describe('POST /itau/token', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should return an access token', async () => {
        const mockResponse = { access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZTJkNTNkZi02MTRlLTNkYTMtOTFmNC1lNjJlODBkZTBmNTIiLCJleHAiOjE3MTY5ODc1MDMsImlhdCI6MTcxNjk4NzIwMywic291cmNlIjoic3RzLXNhbmRib3giLCJlbnYiOiJQIiwiZmxvdyI6IkNDIiwic2NvcGUiOiJjYXNobWFuYWdlbWVudC1jb25zdWx0YWJvbGV0b3MtdjEtYXdzLXNjb3BlIiwidXNlcm5hbWUiOiJlZGVuaWxzb25Ac2lzcGxhbnNpc3RlbWFzLmNvbS5iciIsIm9yZ2FuaXphdGlvbk5hbWUiOiJBdXRvIENhZGFzdHJvIn0.QHfrNPZ31XQjb1qNDN9RAHiSugkpkJRYnfOh0AqmlGw' };
        (authenticateTokenItau as jest.Mock).mockResolvedValue(mockResponse)

        const response = await request(serverToken)
            .post('/itau/token')
            .set('clientID', 'mockClientID')
            .set('clientSecret', 'mockClientSecret')

        expect(response.status).toBe(200)
        expect(response.body).toEqual(mockResponse)
        expect(authenticateTokenItau).toHaveBeenCalledWith({
            clientID: 'mockClientID',
            clientSecret: 'mockClientSecret',
        })
    })

    it('should handle AxiosError', async () => {
        const errorResponse = {
            status: 401,
            data: {
                error_description: 'Invalid credentials',
            },
        }

        const axiosError = new Error('Request failed') as AxiosError
        axiosError.isAxiosError = true
        axiosError.response = errorResponse as AxiosResponse<any>;
        (authenticateTokenItau as jest.Mock).mockRejectedValue(axiosError)

        const response = await request(serverToken)
            .post('/itau/token')
            .set('clientID', 'invalidClientID')
            .set('clientSecret', 'invalidClientSecret')

        expect(response.body.response.status).toBe(401)
        expect(response.body.response.data).toEqual({ error_description: 'Invalid credentials' })
        expect(authenticateTokenItau).toHaveBeenCalledWith({
            clientID: 'invalidClientID',
            clientSecret: 'invalidClientSecret',
        })
    })
})

describe('POST /itau/cobranca', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const mockToken = 'eyJzdWIiOiIxZTJkNTNkZi02MTRlLTNkYTMtOTFmNC1lNjJlODBkZTBmNTIiLCJleHAiOjE3MTY5ODc1MDMsImlhdCI6MTcxNjk4NzIwMywic291cmNlIjoic3RzLXNhbmRib3giLCJlbnYiOiJQIiwiZmxvdyI6IkNDIiwic2NvcGUiOiJjYXNobWFuYWdlbWVudC1jb25zdWx0YWJvbGV0b3MtdjEtYXdzLXNjb3BlIiwidXNlcm5hbWUiOiJlZGVuaWxzb25Ac2lzcGxhbnNpc3RlbWFzLmNvbS5iciIsIm9yZ2FuaXphdGlvbk5hbWUiOiJBdXRvIENhZGFzdHJvIn0'
    const mockQuery = {
        calendario: {
            expiracao: 8640000
        },
        devedor: {
            cpf: '00000000000',
            nome: 'mockNome'
        },
        valor: {
            original: 77.77
        },
        chave: "04071299000126",
        solicitacaoPagador: "MockVenda 123"
    }

    it('should create a charge and return the data when called with valid token and body', async () => {
        const mockResponse = {
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
        };
        (createCharge as jest.Mock).mockResolvedValue(mockResponse)

        const response = await request(server)
            .post('/itau/cobranca')
            .set('Authorization', mockToken)
            .send(mockQuery)

        expect(response.status).toBe(200)
        expect(response.body).toEqual(mockResponse)
        expect(createCharge).toHaveBeenCalledWith(mockToken, mockQuery)
    })

    it('should return 500 if createCharge throws an error', async () => {
        (createCharge as jest.Mock).mockRejectedValue(new Error('Internal Server Error'))

        const response = await request(server)
            .post('/itau/cobranca')
            .set('Authorization', mockToken)
            .send(mockQuery)

        expect(response.status).toBe(500)
    })
})

describe('GET /itau/cobranca/:identifier', () => {
    const mockToken = 'eyJzdWIiOiIxZTJkNTNkZi02MTRlLTNkYTMtOTFmNC1lNjJlODBkZTBmNTIiLCJleHAiOjE3MTY5ODc1MDMsImlhdCI6MTcxNjk4NzIwMywic291cmNlIjoic3RzLXNhbmRib3giLCJlbnYiOiJQIiwiZmxvdyI6IkNDIiwic2NvcGUiOiJjYXNobWFuYWdlbWVudC1jb25zdWx0YWJvbGV0b3MtdjEtYXdzLXNjb3BlIiwidXNlcm5hbWUiOiJlZGVuaWxzb25Ac2lzcGxhbnNpc3RlbWFzLmNvbS5iciIsIm9yZ2FuaXphdGlvbk5hbWUiOiJBdXRvIENhZGFzdHJvIn0'
    const mockIdentifier = 'mock-identifier'
    const mockResponseData = {
        "calendario": {
            "criacao": "2023-01-01T00:00:00Z",
            "expiracao": 86400
        },
        "devedor": {
            "cnpj": "12345678000195",
            "nome": "Empresa de Serviços SA"
        },
        "loc": {
            "id": "1234567890123456789",
            "location": "pix.example.com/pix/qr/v2/c8cff0b5-5b2f-4154-835f-14ede94a2afc",
            "tipoCob": "cob",
            "criacao": "2023-01-01T00:00:00Z"
        },
        "location": "pix.example.com/pix/qr/v2/c8cff0b5-5b2f-4154-835f-14ede94a2afc",
        "valor": {
            "original": "123.45",
            "modalidadeAlteracao": 1
        },
        "chave": "60701190000104",
        "txid": "7978c0c97ea847e78e8849634473c1f1",
        "revisao": 0,
        "status": "ATIVA",
        "pixCopiaECola": "00020101021226840014BR.GOV.BCB.PIX2562pix.example.com/pix/qr/v2/c8cff0b5-5b2f-4154-835f-14ede94a2afc5204000053039865802BR5925Empresa de Serviços SA62070503***6304D56E",
        "solicitacaoPagador": "Informar cartão fidelidade",
        "infoAdicionais": [
            {
                "nome": "Campo 1",
                "valor": "Informação Adicional 1"
            },
            {
                "nome": "Campo 2",
                "valor": "Informação Adicional 2"
            }
        ]
    }

    it('should return a charge when called with valid token and identifier', async () => {
        (findOne as jest.Mock).mockResolvedValue(mockResponseData)

        const response = await request(server)
            .get(`/itau/cobranca/${mockIdentifier}`)
            .set('Authorization', mockToken)

        expect(response.status).toBe(200)
        expect(response.body).toEqual(mockResponseData)
        expect(findOne).toHaveBeenCalledWith(mockToken, mockIdentifier)
    })

    it('should return 500 if findOne throws an error', async () => {
        (findOne as jest.Mock).mockRejectedValue(new Error('Internal Server Error'))

        const response = await request(server)
            .get(`/itau/cobranca/${mockIdentifier}`)
            .set('Authorization', mockToken)

        expect(response.status).toBe(500)
    })
})
