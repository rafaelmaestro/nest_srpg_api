import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseFilters } from '@nestjs/common'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { IsPublic } from '../auth/decorators/is-public.decorator'
import { CreateUsuarioDto } from './dto/create-usuario.dto'
import { UpdateUsuarioDto } from './dto/update-usuario.dto'
import { Usuario } from './entities/usuario.entity'
import { UsuarioExistenteFilter } from './filters/usuario-existente.filter'
import { UsuarioService } from './usuario.service'

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
    @HttpCode(200)
    @Post('/recuperar-senha')
    async recuperarSenha(@Body() recuperarSenhaDto: { emailOuCpf: string }) {
        return await this.usuarioService.recuperarSenha(recuperarSenhaDto.emailOuCpf)
    }

    @Patch()
    async updateUsuario(@Body() updateUsuarioDto: UpdateUsuarioDto, @CurrentUser() usuario: Usuario) {
        return await this.usuarioService.updateUsuario(updateUsuarioDto, usuario)
    }

    @Get('/:cpf')
    async getUsuario(@Param('cpf') cpf: string) {
        return await this.usuarioService.findUserWithCreatedAt(cpf)
    }

    @HttpCode(200)
    @Post('/token')
    compareToken(@Body() props: { token: string }, @CurrentUser() usuario: Usuario) {
        return this.usuarioService.compareToken(props.token, usuario)
    }
}
