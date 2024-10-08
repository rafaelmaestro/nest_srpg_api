import { Body, Controller, Get, Param, Patch, Post, UseFilters } from '@nestjs/common'
import { IsPublic } from '../auth/decorators/is-public.decorator'
import { CreateUsuarioDto } from './dto/create-usuario.dto'
import { UsuarioExistenteFilter } from './filters/usuario-existente.filter'
import { UsuarioService } from './usuario.service'
import { RecuperarSenhaDto } from './dto/recuperar-senha.dto'
import { UpdateUsuarioDto } from './dto/update-usuario.dto'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { Usuario } from './entities/usuario.entity'

@Controller('usuario')
export class UsuarioController {
    constructor(private readonly usuarioService: UsuarioService) {}

    @IsPublic()
    @Get('/hello')
    hello() {
        return {
            Message: 'Hello, world!',
            Date: new Date(),
        }
    }

    @IsPublic()
    @Post()
    @UseFilters(UsuarioExistenteFilter)
    async create(@Body() createUsuarioDto: CreateUsuarioDto) {
        return await this.usuarioService.create(createUsuarioDto)
    }

    @IsPublic()
    @Post('/recuperar-senha')
    async recuperarSenha(@Body() recuperarSenhaDto: RecuperarSenhaDto) {
        return await this.usuarioService.recuperarSenha(recuperarSenhaDto.email)
    }

    @Patch()
    async updateUsuario(@Body() updateUsuarioDto: UpdateUsuarioDto, @CurrentUser() usuario: Usuario) {
        return await this.usuarioService.updateUsuario(updateUsuarioDto, usuario)
    }

    @Get('/:cpf')
    async getUsuario(@Param('cpf') cpf: string) {
        return await this.usuarioService.findUserWithCreatedAt(cpf)
    }
}
