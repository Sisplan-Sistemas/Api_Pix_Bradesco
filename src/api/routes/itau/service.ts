import axios, { AxiosError } from 'axios'

import { ITAU_ENDPOINT, ITAU_TOKEN_ENDPOINT, ITAU_KEY, ITAU_CERT } from '~/config/env'
import { CreateChargeRequest } from './request'
import { logger } from '~/common/logger'
import path from 'path'
import fs from 'fs'
import https from 'https'
import qs from 'qs'
import { BasicGetChargesQuery } from '~/common/classes/Pix/basicEntity.dto'
import { BasicReturn, ClientInfo } from '~/common/classes/types'
import { RequisitionFailedError, ValidationError } from '~/common/classes/error'

export const getAgent = () => {
  if (!ITAU_CERT) throw new Error('Certificate not found')
  if (!ITAU_KEY) throw new Error('Certificate not found')

  const certPath = path.join(__dirname, '..', '..', '..', '..', 'certs', ITAU_CERT)
  const keyPath = path.join(__dirname, '..', '..', '..', '..', 'certs', ITAU_KEY)

  const cert = fs.readFileSync(certPath)
  const key = fs.readFileSync(keyPath)
  const agent = new https.Agent({ cert: cert, key: key })

  return agent
}

export const createCharge = async (token: string, payload: CreateChargeRequest): Promise<BasicReturn> => {
  try {
    const response = await axios({
      method: 'POST',
      url: `${ITAU_ENDPOINT}/v2/cob`,
      headers: {
        Authorization: token
      },
      httpsAgent: getAgent(),
      data: payload,
    })

    return response.data
  } catch (error) {
    const errorResponse = error as AxiosError

    if (errorResponse.response?.status === 401)
      throw new ValidationError(errorResponse.response?.data.error_description, errorResponse.response?.status)

    throw new RequisitionFailedError(errorResponse.response?.data.detail, errorResponse.response?.status)
  }
}

export const authenticateTokenItau = async ({ clientID, clientSecret }: ClientInfo) => {
  try {
    const response = await axios({
      method: 'post',
      url: `${ITAU_TOKEN_ENDPOINT}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      httpsAgent: getAgent(),
      data: qs.stringify({
        grant_type: 'client_credentials',
        client_id: clientID,
        client_secret: clientSecret
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
      url: `${ITAU_ENDPOINT}/v2/cob/${identifier}`,
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
      url: `${ITAU_ENDPOINT}/v2/cob`,
      headers: {
        Authorization: token
      },
      httpsAgent: getAgent(),
      params: {
        inicio: queryParams.inicio.toISOString().split('.')[0] + 'Z',
        fim: queryParams.fim?.toISOString().split('.')[0] + 'Z' ?? ''
      }
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
