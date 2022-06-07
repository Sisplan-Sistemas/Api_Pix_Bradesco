import { IsDate, IsNotEmpty, IsNumber, IsNumberString, IsOptional, IsString, ValidateNested } from 'class-validator'

export class BasicCalendar {
  @IsNotEmpty()
  @IsNumber()
  expiracao: number
}

export class BasicDebtor {
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

export class BasicValue {
  @IsNotEmpty()
  @IsNumberString()
  original: string
}

export class BasicGetChargesQuery {
  @IsDate()
  @IsNotEmpty()
  inicio: Date

  @IsOptional()
  @IsDate()
  @IsNotEmpty()
  fim?: Date
}

export class BasicCreateChargeRequest {
  @IsOptional()
  @ValidateNested()
  calendario: BasicCalendar

  @IsOptional()
  @ValidateNested()
  devedor: BasicDebtor

  @IsNotEmpty()
  @IsString()
  chave: string

  @IsNotEmpty()
  @ValidateNested()
  valor: BasicValue

  @IsOptional()
  @IsString()
  solicitacaoPagador: string
}
