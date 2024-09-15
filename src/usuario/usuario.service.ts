import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { CreateUsuarioDto } from './dto/create-usuario.dto'
import { UsuarioRepository } from './usuario.repository'
import { foto } from './../../biometria-teste.d.ts.json'
import { EMailerService } from '../mailer/mailer.service'

@Injectable()
export class UsuarioService {
    constructor(
        private readonly usuarioRepository: UsuarioRepository,
        private readonly emailerService: EMailerService,
    ) {}
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

    async recuperarSenha(email: string) {
        const usuario = await this.usuarioRepository.findOneByEmail(email)

        if (!usuario) {
            return
        }

        const novaSenha = Math.random().toString(36).slice(-8)
        usuario.hash_recuperacao_senha = await bcrypt.hash(novaSenha, 10)

        await this.usuarioRepository.setHashRecuperacaoSenha(email, usuario.hash_recuperacao_senha)
        await this.emailerService.sendMail(
            'rafaelmaestro@live.com',
            'Recuperação de senha',
            `Sua nova senha é: ${novaSenha}`,
            `Sua nova senha é: <b>${novaSenha}</b>`,
        )
        // TODO: enviar e-mail com a nova senha
    }

    findByEmail(email: string) {
        return this.usuarioRepository.findOneByEmail(email)
    }

    findByCpf(cpf: string) {
        return this.usuarioRepository.findOneByCpf(cpf)
    }
}
