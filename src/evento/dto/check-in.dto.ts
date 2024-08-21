import { IsEmail } from 'class-validator'

export class CheckInDto {
    @IsEmail()
    email_convidado: string
}
