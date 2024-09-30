import { Body, Get, HeaderParam, HttpCode, JsonController, OnUndefined, Param, Post, QueryParams } from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { authenticate, createCharge, findMany, findOne } from './service'
import { BasicCreateChargeRequest, BasicGetChargesQuery } from '~/common/classes/Pix/basicEntity.dto'

@JsonController('/bradesco/cobranca')
export class BradescoCobrancaController {
  @Get('?:inicio')
  @OpenAPI({ summary: 'Retorna a lista de todas as cobranças geradas' })
  @HttpCode(200)
  @OnUndefined(500)
  getAll(@HeaderParam('Authorization') token: string, @QueryParams() query: BasicGetChargesQuery, @HeaderParam('empresa') empresa: string) {
    return findMany(token, query, empresa)
  }

  @Get('/:identifier')
  @OpenAPI({ summary: 'Retorna a cobrança pelo ID' })
  @HttpCode(200)
  @OnUndefined(500)
  getOne(@HeaderParam('Authorization') token: string, @Param('identifier') identifier: string, @HeaderParam('empresa') empresa: string) {
    return findOne(token, identifier, empresa)
  }

  @Post('')
  @OpenAPI({ summary: 'Cria uma nova cobrança' })
  @HttpCode(200)
  @OnUndefined(500)
  post(@HeaderParam('Authorization') token: string, @Body({ validate: true }) body: BasicCreateChargeRequest, @HeaderParam('empresa') empresa: string) {
    return createCharge(token, body, empresa)
  }
}

@JsonController('/bradesco/token')
export class BradescoTokenController {
  @Post('')
  @OpenAPI({ summary: 'Retorna o token de acesso ao Bradesco' })
  @HttpCode(200)
  @OnUndefined(500)
  getToken(@HeaderParam('clientID') clientID: string, @HeaderParam('clientSecret') clientSecret: string, @HeaderParam('empresa') empresa: string) {
    return authenticate({ clientID, clientSecret }, empresa)
  }
}
