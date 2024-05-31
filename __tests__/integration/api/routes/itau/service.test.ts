import path from 'path'
import fs from 'fs'
import https from 'https'
import { getAgent } from '~/api/routes/itau/service'

jest.mock('fs')
jest.mock('https')
jest.mock('axios')
jest.mock('~/common/logger')

describe('getAgent', () => {
    const mockCertPath = path.join(__dirname, '..', '..', '..', '..', '..', 'certs', 'mock-cert.pem')
    const mockCertData = 'mock-certificate-data'

    beforeEach(() => {
        jest.resetModules()
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
