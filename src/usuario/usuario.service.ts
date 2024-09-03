import { BadRequestException, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { CreateUsuarioDto } from './dto/create-usuario.dto'
import { UsuarioRepository } from './usuario.repository'
import { foto } from './../../biometria-teste.d.ts.json'

@Injectable()
export class UsuarioService {
    constructor(private readonly usuarioRepository: UsuarioRepository) {}
    async create(createUsuarioDto: CreateUsuarioDto) {
        const usuario: CreateUsuarioDto = {
            ...createUsuarioDto,
            senha: await bcrypt.hash(createUsuarioDto.senha, 10),
        }

        if (usuario.foto == undefined || usuario.foto == null || usuario.foto == '') {
            if (process.env.BIOMETRIA_ON_BOOLEAN == 'false') {
                usuario.foto = foto
            } else {
                throw new BadRequestException('A foto de referência para biometria é obrigatória')
            }
        }

        const usuarioCriado = await this.usuarioRepository.save(usuario)

        return usuarioCriado
    }

    findByEmail(email: string) {
        return this.usuarioRepository.findOneByEmail(email)
    }

    findByCpf(cpf: string) {
        return this.usuarioRepository.findOneByCpf(cpf)
    }
}
