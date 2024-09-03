import { Module } from '@nestjs/common'
import { UsuarioModel } from './models/usuario.model'
import { UsuarioController } from './usuario.controller'
import { UsuarioRepository } from './usuario.repository'
import { UsuarioService } from './usuario.service'

@Module({
    controllers: [UsuarioController],
    providers: [UsuarioService, UsuarioRepository, UsuarioModel],
    exports: [UsuarioService, UsuarioRepository],
})
export class UsuarioModule {}
