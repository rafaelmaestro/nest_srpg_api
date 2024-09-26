import { Body, Controller, Get, Patch, Post, UseFilters } from '@nestjs/common'
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
    create(@Body() createUsuarioDto: CreateUsuarioDto) {
        return this.usuarioService.create(createUsuarioDto)
    }

    @IsPublic()
    @Post('/recuperar-senha')
    recuperarSenha(@Body() recuperarSenhaDto: RecuperarSenhaDto) {
        return this.usuarioService.recuperarSenha(recuperarSenhaDto.email)
    }

    @Patch()
    updateUsuario(@Body() updateUsuarioDto: UpdateUsuarioDto, @CurrentUser() usuario: Usuario) {
        return this.usuarioService.updateUsuario(updateUsuarioDto, usuario)
    }

    // @Get('/relatorio')
    // async getRelatorioUsuarios(@CurrentUser() user: Usuario) {
    //     return await this.usuarioService.getRelatorioUsuarios(user.cpf)
    // }

    // @Get('/:cpf')
    // async findByCpf(@Param('cpf') cpf: string) {
    //     const usuario = await this.usuarioService.findByCpf(cpf)
    //     return {
    //         ...usuario,
    //         senha: undefined,
    //     }
    // }

    // @Get('/:cpf/enderecos')
    // async findEnderecosByCpf(@Param('cpf') cpf: string) {
    //     const usuario = await this.usuarioService.findByCpf(cpf)
    //     return usuario.enderecos
    // }

    // @Put('/:cpf/enderecos')
    // async addEndereco(@Param('cpf') cpf: string, @Body() createEnderecoDto: CreateEnderecoDto) {
    //     return await this.usuarioService.addEndereco(cpf, createEnderecoDto)
    // }
}
