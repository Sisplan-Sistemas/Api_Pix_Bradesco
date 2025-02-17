import axios, { AxiosError, AxiosResponse } from 'axios'
import fs from 'fs'
import qs from 'qs'
import path from 'path'
import https from 'https'

import { BANCO_BRASIL_AUTH_ENDPOINT, BANCO_BRASIL_CERT, BANCO_BRASIL_CERT_PASSPHRASE, BANCO_BRASIL_ENDPOINT } from '~/config/env'
import { BasicReturn } from '~/common/classes/types'
import { logger } from '~/common/logger'
import { RequisitionFailedError, ValidationError } from '~/common/classes/error'
import { BasicCreateChargeRequest, BasicGetChargesQuery } from '../../../common/classes/Pix/basicEntity.dto'
import { Agent } from 'http'

export const getAgent: (empresa: string) => Agent = (empresa: string) => {
  if (!BANCO_BRASIL_CERT) throw new Error('Certificate not found')

  const certPath = path.join(__dirname, '..', '..', '..', '..', 'certs', empresa, BANCO_BRASIL_CERT)
  if (!fs.existsSync(certPath)) throw new Error(`Certificado não encontrado: ${certPath}`)
  const cert = fs.readFileSync(certPath)
  const agent = new https.Agent({ pfx: cert, passphrase: BANCO_BRASIL_CERT_PASSPHRASE })

  return agent
}

export const createCharge = async (token: string, payload: BasicCreateChargeRequest, empresa: string, developer_application_key: string): Promise<BasicReturn> => {
  try {
    if (!payload.calendario) payload.calendario = { expiracao: 7200 }

    const response = await axios({
      method: 'POST',
      url: `${BANCO_BRASIL_ENDPOINT}/cob?gw-app-key=${encodeURIComponent(developer_application_key)}`,
      headers: {
        Authorization: token
      },
      httpsAgent: getAgent(empresa),
      data: payload
    })

    return response.data
  } catch (error) {
    const errorResponse = error as AxiosError

    if (errorResponse.response?.status === 401)
      throw new ValidationError(errorResponse.response?.data.error_description, errorResponse.response?.status)

    const retorno = errorResponse.response?.data.detail;

    throw new RequisitionFailedError(retorno, errorResponse.response?.status)
  }
}

export const authenticate = async (clientID: string, clientSecret: string, empresa: string, developer_application_key: string): Promise<string> => {
  const credentials = Buffer.from(`${clientID}:${clientSecret}`).toString('base64')

  try {
    const response: AxiosResponse<string> = await axios({
      method: 'POST',
      url: `${BANCO_BRASIL_AUTH_ENDPOINT}?gw-app-key=${encodeURIComponent(developer_application_key)}`,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      httpsAgent: getAgent(empresa),
      data: qs.stringify({
        grant_type: 'client_credentials',
        Client_Id: clientID,
        Client_Secret: clientSecret,
        scope:
          'cob.write cob.read pix.write pix.read'
      })
    })

    logger.info('Created token successfully')
    return response.data
  } catch (error) {
    const errorResponse = error as AxiosError
    const retorno = errorResponse.response?.data.violacoes;
    let listaRetorno: string = errorResponse.response?.data.detail + ' ';
    for (let i = 0; i < retorno.length; i++) {
      listaRetorno += retorno[i].razao;
    }
    throw new ValidationError(listaRetorno, errorResponse.response?.status)
  }
}

export const findOne = async (token: string, identifier: string, empresa: string, developer_application_key: string) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${BANCO_BRASIL_ENDPOINT}/cob/${identifier}?gw-app-key=${encodeURIComponent(developer_application_key)}`,
      headers: {
        Authorization: token
      },
      httpsAgent: getAgent(empresa)
    })

    logger.info(`Found one charge with identifier ${identifier}`)
    return response.data
  } catch (error) {
    const errorResponse = error as AxiosError

    if (errorResponse.response?.status === 401)
      throw new ValidationError(errorResponse.response?.data.error_description, errorResponse.response?.status)

    throw new RequisitionFailedError(errorResponse.response?.data.detail, errorResponse.response?.status)
  }
}

export const findQrCode = async (token: string, identifier: string, empresa: string) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${BANCO_BRASIL_ENDPOINT}/qrcode/consulta/${identifier}`,
      headers: {
        Authorization: token
      },
      httpsAgent: getAgent(empresa)
    })

    logger.info(`Found one charge with identifier ${identifier}`)
    return response.data
  } catch (error) {
    const errorResponse = error as AxiosError

    if (errorResponse.response?.status === 401)
      throw new ValidationError(errorResponse.response?.data.error_description, errorResponse.response?.status)

    throw new RequisitionFailedError(errorResponse.response?.data.detail, errorResponse.response?.status)
  }
}

export const findMany = async (token: string, queryParams: BasicGetChargesQuery, empresa: string) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${BANCO_BRASIL_ENDPOINT}/cob`,
      headers: {
        Authorization: token
      },
      params: { inicio: queryParams.inicio, fim: queryParams.fim },
      httpsAgent: getAgent(empresa)
    })

    logger.info('Found  charges')
    return response.data
  } catch (error) {
    const errorResponse = error as AxiosError

    if (errorResponse.response?.status === 401)
      throw new ValidationError(errorResponse.response?.data.error_description, errorResponse.response?.status)

    throw new RequisitionFailedError(errorResponse.response?.data.detail, errorResponse.response?.status)
  }
}
