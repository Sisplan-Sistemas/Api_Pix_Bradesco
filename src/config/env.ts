import { config } from 'dotenv'
import { resolve } from 'path'

import { EnvironmentTypes } from '~/common/classes/environment'

export const isProductionEnvironment = () => process.env.NODE_ENV === EnvironmentTypes.PROD
export const isDevelopmentEnvironment = () => process.env.NODE_ENV === EnvironmentTypes.DEV
export const isTestEnvironment = () => process.env.NODE_ENV === EnvironmentTypes.TEST

/**
 * Loads the environment variables from the .env file.
 */
const fileName = (() => {
  if (isDevelopmentEnvironment()) return '.env.dev'
  if (isTestEnvironment()) return '.env.test'
  return '.env'
})()

config({ path: resolve(__dirname, '..', '..', fileName) })

export const {
  PORT,
  BRADESCO_ENDPOINT,
  BRADESCO_CERT,
  BRADESCO_CERT_PASSPHRASE,
  ITAU_ENDPOINT,
  ITAU_TOKEN_ENDPOINT,
  ITAU_CERT,
  ITAU_CERT_PASSPHRASE,
  ITAU_KEY,
  SICOOB_ENDPOINT,
  SICOOB_AUTH_ENDPOINT,
  SICOOB_CERT,
  SICOOB_CERT_PASSPHRASE,
  AILOS_ENDPOINT,
  AILOS_AUTH_ENDPOINT,
  AILOS_CERT,
  AILOS_CERT_PASSPHRASE,
  BANCO_BRASIL_ENDPOINT,
  BANCO_BRASIL_AUTH_ENDPOINT,
  BANCO_BRASIL_CERT,
  BANCO_BRASIL_CERT_PASSPHRASE,
  SICREDI_ENDPOINT,
  SICREDI_AUTH_ENDPOINT,
  SICREDI_CERT,
  SICREDI_KEY,
  SICREDI_CERT_PASSPHRASE
} = process.env
