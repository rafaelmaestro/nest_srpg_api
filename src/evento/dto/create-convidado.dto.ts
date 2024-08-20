import { IsEmail, IsString } from 'class-validator'
import { Convidado } from '../entities/convidado.entity'

export class CreateConvidadoDto extends Convidado {
    @IsEmail()
    email_convidado: string

    @IsString()
    id_evento: string
}
