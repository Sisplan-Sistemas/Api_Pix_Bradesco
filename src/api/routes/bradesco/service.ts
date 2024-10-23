import axios, { AxiosError } from 'axios'
import fs from 'fs'
import qs from 'qs'
import path from 'path'
import https from 'https'

import { BRADESCO_CERT, BRADESCO_CERT_PASSPHRASE, BRADESCO_ENDPOINT } from '~/config/env'
import { BasicReturn, ClientInfo } from '~/common/classes/types'
import { logger } from '~/common/logger'
import { RequisitionFailedError, ValidationError } from '~/common/classes/error'
import { BasicCreateChargeRequest, BasicGetChargesQuery } from '../../../common/classes/Pix/basicEntity.dto'

export const getAgent = (empresa: string) => {
  if (!BRADESCO_CERT) throw new Error('Certificate not found')

  const certPath = path.join(__dirname, '..', '..', '..', '..', 'certs', empresa, BRADESCO_CERT)
  if (!fs.existsSync(certPath)) throw new Error(`Certificado não encontrado: ${certPath}`)
  const cert = fs.readFileSync(certPath)
  const agent = new https.Agent({ pfx: cert, passphrase: BRADESCO_CERT_PASSPHRASE })

  return agent
}

export const createCharge = async (token: string, payload: BasicCreateChargeRequest, empresa: string): Promise<BasicReturn> => {
  try {
    const response = await axios({
      method: 'POST',
      url: `${BRADESCO_ENDPOINT}/v2/cob-emv`,
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      },
      httpsAgent: getAgent(empresa),
      data: payload
    })

    return response.data
  } catch (error) {
    const errorResponse = error as AxiosError

    if (errorResponse.response?.status === 401)
      throw new ValidationError(errorResponse.response?.data.error_description, errorResponse.response?.status)

    throw new RequisitionFailedError(errorResponse.response?.data.detail, errorResponse.response?.status)
  }
}

export const authenticate = async ({ clientID, clientSecret }: ClientInfo, empresa: string) => {
  const credentials = Buffer.from(`${clientID}:${clientSecret}`).toString('base64')

  try {
    const response = await axios({
      method: 'POST',
      url: `${BRADESCO_ENDPOINT}/auth/server/oauth/token`,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      httpsAgent: getAgent(empresa),
      data: qs.stringify({
        grant_type: 'client_credentials'
      })
    })

    logger.info('Created token successfully')
    return response.data
  } catch (error) {
    const errorResponse = error as AxiosError

    throw new ValidationError(errorResponse.response?.data.message, errorResponse.response?.status)
  }
}

export const findOne = async (token: string, identifier: string, empresa: string) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${BRADESCO_ENDPOINT}/v2/cob/${identifier}`,
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
      url: `${BRADESCO_ENDPOINT}/v2/cob`,
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
