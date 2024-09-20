import axios, { AxiosError, AxiosResponse } from 'axios'
import fs from 'fs'
import qs from 'qs'
import path from 'path'
import https from 'https'

import { SICREDI_AUTH_ENDPOINT, SICREDI_CERT, SICREDI_ENDPOINT, SICREDI_KEY } from '~/config/env'
import { BasicReturn } from '~/common/classes/types'
import { logger } from '~/common/logger'
import { RequisitionFailedError, ValidationError } from '~/common/classes/error'
import { BasicCreateChargeRequest, BasicGetChargesQuery } from '../../../common/classes/Pix/basicEntity.dto'
import { Agent } from 'http'

interface AgentOptions {
  cert?: Buffer;
  key?: Buffer;
  passphrase?: string;
}

export const getAgent: (empresa: string) => Agent = (empresa: string) => {
  if (!SICREDI_CERT || !SICREDI_KEY) throw new Error('Certificate not found')

  const certPath = path.join(__dirname, '..', '..', '..', '..', 'certs', empresa, SICREDI_CERT)
  const keyPath = path.join(__dirname, '..', '..', '..', '..', 'certs', empresa, SICREDI_KEY)
  if (!fs.existsSync(certPath)) throw new Error(`Certificado não encontrado: ${certPath}`)
  if (!fs.existsSync(keyPath)) throw new Error(`Chave não encontrada: ${keyPath}`)
  const cert = fs.readFileSync(certPath);
  const key = fs.readFileSync(keyPath);

  const agentOptions: AgentOptions = {
    cert: cert,
    key: key
  }

  const agent = new https.Agent(agentOptions)

  return agent
}

export const createCharge = async (token: string, payload: BasicCreateChargeRequest, empresa: string): Promise<BasicReturn> => {
  try {
    if (!payload.calendario) payload.calendario = { expiracao: 7200 }

    const response = await axios({
      method: 'POST',
      url: `${SICREDI_ENDPOINT}/cob`,
      headers: {
        Authorization: token
      },
      httpsAgent: getAgent(empresa),
      data: payload
    })

    return response.data
  } catch (error) {
    const errorResponse = error as AxiosError
    const errorMensage = errorResponse.response?.data.detail.detail == undefined ? errorResponse.response?.data.detail : errorResponse.response?.data.detail.detail;

    if (errorResponse.response?.status === 401)
      throw new ValidationError(errorResponse.response?.data.detail, errorResponse.response?.status)

    throw new RequisitionFailedError(errorMensage, errorResponse.response?.status)
  }
}

export const authenticate = async (clientID: string, clientSecret: string, empresa: string): Promise<string> => {
  try {
    const credentials = Buffer.from(`${clientID}:${clientSecret}`).toString('base64')

    const response: AxiosResponse<string> = await axios({
      method: 'POST',
      url: SICREDI_AUTH_ENDPOINT,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      httpsAgent: getAgent(empresa),
      data: qs.stringify({
        grant_type: 'client_credentials',
        scope: 'cob.read+cob.write+pix.read'
      })
    })
    logger.info('Created token successfully')
    return response.data
  } catch (error) {
    const errorResponse = error as AxiosError

    if (errorResponse.message !== '') {
      throw new ValidationError(errorResponse.message, 503)
    }

    throw new ValidationError(errorResponse.response?.data.error_description, errorResponse.response?.status)
  }
}

export const findOne = async (token: string, identifier: string, empresa: string) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${SICREDI_ENDPOINT}/cob/${identifier}`,
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
      url: `${SICREDI_ENDPOINT}/cob`,
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
