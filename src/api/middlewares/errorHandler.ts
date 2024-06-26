import { ExpressErrorMiddlewareInterface, Middleware } from 'routing-controllers'
import { NextFunction, Request, Response } from 'express'
import { logger } from '~/common/logger'

@Middleware({ type: 'after' })
export class ErrorHandler implements ExpressErrorMiddlewareInterface {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(error: any, request: Request, response: Response, next: NextFunction) {
    /**
     * Status 500 is to guarantee that uncaught errors are not going to return success statuses.
     */
    response.statusCode = error.httpCode ? error.httpCode : 500

    /**
     * JSON response to be sent as body.
     */
    const responseJSONError = {
      code: response.statusCode,
      message: error.message,
      errors: error.errors
    }

    logger.error(responseJSONError.message)
    response.json(responseJSONError)

    next()
  }
}
