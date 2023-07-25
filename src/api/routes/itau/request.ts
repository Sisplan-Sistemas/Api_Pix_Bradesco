import { IsDate, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, ValidateNested } from 'class-validator'
import {
  BasicCalendar,
  BasicCreateChargeRequest,
  BasicDebtor,
  BasicGetChargesQuery,
  BasicValue
} from '~/common/classes/Pix/basicEntity.dto'

export class Calendar extends BasicCalendar {
  @IsNotEmpty()
  @IsNumber()
  expiracao: number
}

export class Debtor extends BasicDebtor {
  @IsString()
  @IsOptional()
  cnpj?: string

  @IsString()
  @IsOptional()
  cpf?: string

  @IsString()
  @IsNotEmpty()
  nome: string
}

export class Value extends BasicValue {
  @IsNotEmpty()
  @IsNumberString()
  original: string
}

export class GetChargesQuery extends BasicGetChargesQuery {
  @IsDate()
  @IsNotEmpty()
  inicio: Date

  @IsOptional()
  @IsDate()
  @IsNotEmpty()
  fim?: Date
}

export class CreateChargeRequest extends BasicCreateChargeRequest {
  @IsOptional()
  @ValidateNested()
  calendario: Calendar

  @IsOptional()
  @ValidateNested()
  devedor: Debtor

  @IsNotEmpty()
  @IsString()
  chave: string

  @IsNotEmpty()
  @ValidateNested()
  valor: Value

  @IsOptional()
  @IsString()
  solicitacaoPagador: string
}
