import { IsBase64, IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator'
import { Usuario } from '../entities/usuario.entity'

export class CreateUsuarioDto extends Usuario {
    @IsString()
    cpf: string

    @IsString()
    nome: string

    @IsEmail()
    email: string

    @IsString()
    @MinLength(4)
    @MaxLength(20)
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'senha muito fraca',
    })
    senha: string

    @IsBase64()
    foto?: string
}
