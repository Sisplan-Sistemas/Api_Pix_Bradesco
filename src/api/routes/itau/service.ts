import axios, { AxiosError } from 'axios'

import { ITAU_ENDPOINT, ITAU_TOKEN_ENDPOINT, ITAU_CERT } from '~/config/env'
import { PixRetorno, ClientInfo } from '~/classes/types'
import { CreateChargeRequest, GetChargesQuery } from './request'
import { logger } from '~/common/logger'
import { RequisitionFailedError, ValidationError } from '~/classes/error'
import path from 'path'
import fs from 'fs'
import https from 'https'
import qs from 'qs'

export const getAgent = () => {
  if (!ITAU_CERT) throw new Error('Certificate not found')

  const certPath = path.join(__dirname, '..', '..', '..', '..', 'certs', ITAU_CERT)
  const cert = fs.readFileSync(certPath)
  const agent = new https.Agent({ ca: cert })

  return agent
}

export const createCharge = async (token: string, payload: CreateChargeRequest): Promise<PixRetorno> => {
  try {
    const response = await axios({
      method: 'POST',
      url: `${ITAU_ENDPOINT}/v2/cob/`,
      headers: {
        Authorization: token
      },
      httpsAgent: getAgent(),
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

export const authenticateTokenItau = async ({ clientID, clientSecret }: ClientInfo) => {
  try {
    const credentials = Buffer.from(`${clientID}:${clientSecret}`).toString('base64')
    const response = await axios({
      method: 'POST',
      url: `${ITAU_TOKEN_ENDPOINT}/oauth/token`,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      httpsAgent: getAgent(),
      data: qs.stringify({
        grant_type: 'client_credentials'
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
