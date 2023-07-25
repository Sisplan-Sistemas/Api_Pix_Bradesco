import { Body, Get, HeaderParam, HttpCode, JsonController, OnUndefined, Param, Post, QueryParams } from 'routing-controllers'
import { OpenAPI } from 'routing-controllers-openapi'
import { CreateChargeRequest, GetChargesQuery } from './request'
import { authenticateTokenItau, createCharge, findMany, findOne } from './service'

@JsonController('/itau/cobranca')
export class ItauController {
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
  post(@HeaderParam('Authorization') token: string, @Body({ validate: true }) body: CreateChargeRequest) {
    return createCharge(token, body)
  }

@JsonController('/itau/token')
export class ItauTokenController {
  @Post('')
  @OpenAPI({ summary: 'Retorna o token de acesso ao Itau' })
  @HttpCode(200)
  @OnUndefined(500)
  post(@HeaderParam('clientID') clientID: string, @HeaderParam('clientSecret') clientSecret: string) {
    return authenticateTokenItau({ clientID, clientSecret })
  }
}
