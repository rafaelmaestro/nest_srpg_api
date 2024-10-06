import { IsDate, IsEmail, IsNumber, IsOptional } from 'class-validator'

export class CheckInDto {
    @IsEmail()
    email_convidado: string

    @IsOptional()
    @IsDate()
    data?: Date

    @IsOptional()
    @IsNumber()
    porcentagem_presenca?: number
}
