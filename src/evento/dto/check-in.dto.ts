import { IsDate, IsEmail, IsOptional } from 'class-validator'

export class CheckInDto {
    @IsEmail()
    email_convidado: string

    @IsOptional()
    @IsDate()
    data?: Date
}
