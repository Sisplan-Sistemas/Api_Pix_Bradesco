import axios, { AxiosError, AxiosResponse } from 'axios'
import fs from 'fs'
import qs from 'qs'
import path from 'path'
import https from 'https'

import { AILOS_AUTH_ENDPOINT, AILOS_CERT, AILOS_CERT_PASSPHRASE, AILOS_ENDPOINT } from '~/config/env'
import { BasicReturn } from '~/common/classes/types'
import { logger } from '~/common/logger'
import { RequisitionFailedError, ValidationError } from '~/common/classes/error'
import { BasicCreateChargeRequest, BasicGetChargesQuery } from '../../../common/classes/Pix/basicEntity.dto'
import { Agent } from 'http'

export const getAgent: () => Agent = () => {
  if (!AILOS_CERT) throw new Error('Certificate not found')

  const certPath = path.join(__dirname, '..', '..', '..', '..', 'certs', AILOS_CERT)
  const cert = fs.readFileSync(certPath)
  const agent = new https.Agent({ pfx: cert, passphrase: AILOS_CERT_PASSPHRASE })

  return agent
}

export const createCharge = async (token: string, payload: BasicCreateChargeRequest): Promise<BasicReturn> => {
  try {
    if (!payload.calendario) payload.calendario = { expiracao: 7200 }

    const response = await axios({
      method: 'POST',
      url: `${AILOS_ENDPOINT}/cob`,
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

    const retorno = errorResponse.response?.data.violacoes;
    let listaRetorno: string = errorResponse.response?.data.detail + ' ';
    for (let i = 0; i < retorno.length; i++) {
      listaRetorno += retorno[i].razao;
    }

    throw new RequisitionFailedError(listaRetorno, errorResponse.response?.status)
  }
}

export const authenticate = async (clientID: string, clientSecret: string): Promise<string> => {
  try {
    const response: AxiosResponse<string> = await axios({
      method: 'POST',
      url: AILOS_AUTH_ENDPOINT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      httpsAgent: getAgent(),
      data: qs.stringify({
        Client_Id: clientID,
        Client_Secret: clientSecret,
        scope:
          'cob.write cob.read pix.write pix.read qrcode.write qrcode.read'
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

export const findOne = async (token: string, identifier: string) => {
  try {
    const response = await axios({
      method: 'GET',
      url: `${AILOS_ENDPOINT}/cob/${identifier}`,
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
      url: `${AILOS_ENDPOINT}/cob`,
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
