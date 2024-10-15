import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { EMailerService } from '../mailer/mailer.service'
import { foto } from './../../biometria-teste.d.ts.json'
import { CreateUsuarioDto } from './dto/create-usuario.dto'
import { UpdateUsuarioDto } from './dto/update-usuario.dto'
import { Usuario } from './entities/usuario.entity'
import { UsuarioRepository } from './usuario.repository'

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
            throw new NotFoundException('Usuário não encontrado')
        }

        const novaSenha = Math.random().toString(36).slice(-8)
        usuario.hash_recuperacao_senha = await bcrypt.hash(novaSenha, 10)

        await this.usuarioRepository.setHashRecuperacaoSenha(email, usuario.hash_recuperacao_senha)

        this.emailerService.sendMail(
            email,
            'Recuperação de senha',
            `Sua nova senha é: ${novaSenha}`,
            `Sua nova senha é: <b>${novaSenha}</b>`,
        )
    }

    async findByEmail(email: string) {
        return this.usuarioRepository.findOneByEmail(email)
    }

    async findByCpf(cpf: string) {
        return this.usuarioRepository.findOneByCpf(cpf)
    }

    async findUserWithCreatedAt(cpf: string) {
        const usuario = await this.usuarioRepository.findOneByCpfWithBiometria(cpf)
        if (!usuario) {
            throw new NotFoundException('Usuário não encontrado')
        }

        return {
            cpf: usuario.cpf,
            nome: usuario.nome,
            email: usuario.email,
            dt_criacao: usuario.dt_criacao.toISOString(),
            dt_ult_atualizacao: usuario.dt_ult_atualizacao.toISOString(),
            biometria: {
                id: usuario.biometria.id,
            },
        }
    }

    async updateUsuario(updateUsuarioDto: UpdateUsuarioDto, usuario: Usuario) {
        if (!updateUsuarioDto.email && !updateUsuarioDto.cpf) {
            throw new BadRequestException('O e-mail ou CPF são obrigatórios para atualização')
        }

        if (updateUsuarioDto.email && updateUsuarioDto.email !== usuario.email) {
            throw new BadRequestException('Não é possível alterar informações de outro usuário')
        }

        if (updateUsuarioDto.cpf && updateUsuarioDto.cpf !== usuario.cpf) {
            throw new BadRequestException('Não é possível alterar informações de outro usuário')
        }

        if (updateUsuarioDto.senha && !updateUsuarioDto.senha_antiga) {
            throw new BadRequestException('A senha antiga é obrigatória para atualização da senha')
        }

        if (updateUsuarioDto.email_novo && updateUsuarioDto.email_novo === usuario.email) {
            throw new BadRequestException('O novo e-mail deve ser diferente do e-mail atual')
        }

        if (
            updateUsuarioDto.senha &&
            updateUsuarioDto.senha_antiga &&
            updateUsuarioDto.senha == updateUsuarioDto.senha_antiga
        ) {
            throw new BadRequestException('A nova senha deve ser diferente da senha antiga')
        }

        return this.usuarioRepository.updateUsuario(updateUsuarioDto)
    }

    associateToken(email: string, token: string) {
        this.usuarioRepository.associateToken(email, token)

        this.emailerService.sendMail(
            email,
            'Token de verificação',
            null,
            `Insira o token para realizar login no SRPG: <b>${token}</b>`,
        )
    }

    async compareToken(token: string, usuario: Usuario) {
        const tokenValido = await this.usuarioRepository.findOneByCpf(usuario.cpf)

        if (tokenValido.token_email != token) {
            throw new UnauthorizedException('Token inválido')
        }

        return true
    }
}
