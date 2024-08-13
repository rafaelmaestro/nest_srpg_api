import { Controller, Get } from '@nestjs/common'
import { IsPublic } from '../auth/decorators/is-public.decorator'
import { UsuarioService } from './usuario.service'

@Controller('usuario')
export class UsuarioController {
    constructor(private readonly usuarioService: UsuarioService) {}

    @IsPublic()
    @Get()
    hello() {
        return {
            message: 'Hello, world!',
            Date: new Date(),
        }
    }

    // @IsPublic()
    // @Post()
    // @UseFilters(UsuarioExistenteFilter)
    // create(@Body() createUsuarioDto: CreateUsuarioDto) {
    //     return this.usuarioService.create(createUsuarioDto)
    // }

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
