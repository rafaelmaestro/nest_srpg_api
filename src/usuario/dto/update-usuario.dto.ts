import { PartialType } from '@nestjs/mapped-types'
import { CreateUsuarioDto } from './create-usuario.dto'
import { IsEmail, IsOptional, IsString, isString } from 'class-validator'

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
    @IsOptional()
    @IsString()
    senha_antiga?: string

    @IsOptional()
    @IsEmail()
    email_novo?: string
}
