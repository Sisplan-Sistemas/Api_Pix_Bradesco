import { Body, Get, HeaderParam, HttpCode, JsonController, OnUndefined, Param, Post, QueryParams } from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { authenticateTokenBradesco, createCharge, findMany, findOne } from './service'
import { BasicCreateChargeRequest, BasicGetChargesQuery } from '../../../common/classes/Pix/basicEntity.dto'

@JsonController('/bradesco/cobranca')
export class BradescoController {
  @Get('?:inicio')
  @OpenAPI({ summary: 'Retorna a lista de todas as cobranças geradas' })
  @HttpCode(200)
  @OnUndefined(500)
  getAll(@HeaderParam('Authorization') token: string, @QueryParams() query: BasicGetChargesQuery) {
    return findMany(token, query)
  }

  @Get('/:identifier')
  @OpenAPI({ summary: 'Retorna a cobrança pelo ID' })
  @HttpCode(200)
  @OnUndefined(500)
  getOne(@HeaderParam('Authorization') token: string, @Param('identifier') identifier: string) {
    return findOne(token, identifier)
  }

  @Post('')
  @OpenAPI({ summary: 'Cria uma nova cobrança' })
  @HttpCode(200)
  @OnUndefined(500)
  post(@HeaderParam('Authorization') token: string, @Body({ validate: true }) body: BasicCreateChargeRequest) {
    return createCharge(token, body)
  }

  @Post('/bradesco/token')
  @OpenAPI({ summary: 'Retorna o token de acesso ao Bradesco' })
  @HttpCode(200)
  @OnUndefined(500)
  getToken(@HeaderParam('clientID') clientID: string, @HeaderParam('clientSecret') clientSecret: string) {
    return authenticateTokenBradesco({ clientID, clientSecret })
  }
}
