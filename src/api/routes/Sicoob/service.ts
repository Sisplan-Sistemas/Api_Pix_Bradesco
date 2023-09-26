import axios, { AxiosError, AxiosResponse } from 'axios'
import fs from 'fs'
import qs from 'qs'
import path from 'path'
import https from 'https'

import { SICOOB_AUTH_ENDPOINT, SICOOB_CERT, SICOOB_CERT_PASSPHRASE, SICOOB_ENDPOINT } from '~/config/env'
import { BasicReturn } from '~/common/classes/types'
import { logger } from '~/common/logger'
import { RequisitionFailedError, ValidationError } from '~/common/classes/error'
import { BasicCreateChargeRequest, BasicGetChargesQuery } from '../../../common/classes/Pix/basicEntity.dto'
import { Agent } from 'http'

export const getAgent: () => Agent = () => {
  if (!SICOOB_CERT) throw new Error('Certificate not found')

  const certPath = path.join(__dirname, '..', '..', '..', '..', 'certs', SICOOB_CERT)
  const cert = fs.readFileSync(certPath)
  const agent = new https.Agent({ pfx: cert, passphrase: SICOOB_CERT_PASSPHRASE })

  return agent
}

export const createCharge = async (token: string, payload: BasicCreateChargeRequest): Promise<BasicReturn> => {
  try {
    if (!payload.calendario) payload.calendario = { expiracao: 7200 }

    const response = await axios({
      method: 'POST',
      url: `${SICOOB_ENDPOINT}/cob`,
      headers: {
        Authorization: token
      },
      httpsAgent: getAgent(),
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

export const authenticate = async (clientID: string): Promise<string> => {
  try {
    const response: AxiosResponse<string> = await axios({
      method: 'POST',
      url: SICOOB_AUTH_ENDPOINT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      httpsAgent: getAgent(),
      data: qs.stringify({
        grant_type: 'client_credentials',
        client_id: clientID,
        scope:
          'cob.read cob.write cobv.write cobv.read lotecobv.write lotecobv.read pix.write pix.read webhook.read webhook.write payloadlocation.write payloadlocation.read'
      })
    })

    logger.info('Created token successfully')
    return response.data
  } catch (error) {
    const errorResponse = error as AxiosError
    throw new ValidationError(errorResponse.response?.data.error_description, errorResponse.response?.status)
  }
}

export const findOne = async (token: string, identifier: string) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${SICOOB_ENDPOINT}/cob/${identifier}`,
      headers: {
        Authorization: token
      },
      httpsAgent: getAgent()
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

export const findMany = async (token: string, queryParams: BasicGetChargesQuery) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${SICOOB_ENDPOINT}/cob`,
      headers: {
        Authorization: token
      },
      params: { inicio: queryParams.inicio, fim: queryParams.fim },
      httpsAgent: getAgent()
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
