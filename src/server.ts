import 'reflect-metadata'

import path from 'path'
import { Express } from 'express'
import { createExpressServer, RoutingControllersOptions } from 'routing-controllers'
import { loadDocumentation } from './common/helpers/openApi'

/**
 * Loading controllers.
 */
const controllersPath: string = path.resolve(__dirname, 'api', 'routes', '**', 'controller.*')

/**
 * Loading middlewares.
 */
const middlewaresPath: string = path.resolve(__dirname, 'api', 'middlewares', '**', '*.*')

/**
 * Server options.
 */
export const serverOptions: RoutingControllersOptions = {
  cors: '*',
  defaultErrorHandler: false,
  controllers: [controllersPath],
  middlewares: [middlewaresPath]
}

/**
 * Creating server.
 */
const app: Express = createExpressServer(serverOptions)

export const server: () => Promise<Express> = async () => {
  loadDocumentation(app)
  return app
}
