import { IsDate, IsEmail } from 'class-validator'

export class CheckInDto {
    @IsEmail()
    email_convidado: string

    @IsDate()
    data?: Date
}
