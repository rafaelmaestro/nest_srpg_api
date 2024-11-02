import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { DataSource } from 'typeorm'
import { ulid } from 'ulid'
import { CreateUsuarioDto } from './dto/create-usuario.dto'
import { UpdateUsuarioDto } from './dto/update-usuario.dto'
import { UsuarioExistenteError } from './errors/usuario-existente.error'
import { BiometriaUsuarioModel } from './models/biometria.model'
import { UsuarioModel } from './models/usuario.model'

@Injectable()
export class UsuarioRepository {
    constructor(private readonly dataSource: DataSource) {}

    async save(usuario: CreateUsuarioDto) {
        const queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()
        try {
            const usuarioExistente = await this.findOneByCpf(usuario.cpf)

            if (usuarioExistente) {
                throw new UsuarioExistenteError('Usuário já cadastrado')
            }

            const usuarioParaSalvar = {
                ...usuario,
                id: ulid(),
                cpf_usuario: usuario.cpf,
            }

            const usuarioCriado = await queryRunner.manager.save(UsuarioModel, usuarioParaSalvar)
            const biometriaCriada = await queryRunner.manager.save(BiometriaUsuarioModel, usuarioParaSalvar)

            await queryRunner.commitTransaction()
            return {
                usuario: {
                    cpf: usuarioCriado.cpf,
                    nome: usuarioCriado.nome,
                    email: usuarioCriado.email,
                },
                biometria: {
                    id: biometriaCriada.id,
                },
            }
        } catch (error) {
            await queryRunner.rollbackTransaction()
            throw error
        } finally {
            await queryRunner.release()
        }
    }

    async findOneByEmail(email: string) {
        const usuario = await UsuarioModel.findOne({ where: { email } })
        return usuario
    }

    async findOneByCpf(cpf: string) {
        const usuario = await UsuarioModel.findOne({ where: { cpf } })

        return usuario
    }

    async findOneByEmailWithBiometria(email: string) {
        const usuario = await UsuarioModel.findOne({ where: { email }, relations: ['biometria'] })
        return usuario
    }

    async findOneByCpfWithBiometria(cpf: string) {
        const usuario = await UsuarioModel.findOne({ where: { cpf }, relations: ['biometria'] })
        return usuario
    }

    async setHashRecuperacaoSenha(usuarioModel: UsuarioModel, senha: string) {
        return await usuarioModel.save()
    }

    async updateUsuario(updateUsuarioDto: UpdateUsuarioDto) {
        let usuario: UsuarioModel = null

        if (updateUsuarioDto.cpf) {
            usuario = await this.findOneByCpfWithBiometria(updateUsuarioDto.cpf)
        } else {
            usuario = await this.findOneByEmailWithBiometria(updateUsuarioDto.email)
        }

        if (!usuario) {
            throw new NotFoundException('Usuário não encontrado')
        }

        if (updateUsuarioDto.senha) {
            if (!(await bcrypt.compare(updateUsuarioDto.senha_antiga, usuario.senha))) {
                if (usuario.hash_recuperacao_senha) {
                    const senhaValida = await bcrypt.compare(
                        updateUsuarioDto.senha_antiga,
                        usuario.hash_recuperacao_senha,
                    )
                    if (!senhaValida) {
                        throw new BadRequestException('Senha antiga inválida')
                    }
                } else {
                    throw new BadRequestException('Senha antiga inválida')
                }
            }

            if (await bcrypt.compare(updateUsuarioDto.senha, usuario.senha)) {
                throw new BadRequestException('A nova senha deve ser diferente da senha antiga')
            }

            usuario.senha = bcrypt.hashSync(updateUsuarioDto.senha, 10)
        }

        if (updateUsuarioDto.email_novo) {
            usuario.email = updateUsuarioDto.email_novo
        }

        if (updateUsuarioDto.foto) {
            usuario.biometria.foto = updateUsuarioDto.foto
        }

        const usuarioAlterado = await usuario.save()

        return {
            cpf: usuarioAlterado.cpf,
            nome: usuarioAlterado.nome,
            email: usuarioAlterado.email,
            dt_criacao: usuario.dt_criacao.toISOString(),
            dt_ult_atualizacao: usuario.dt_ult_atualizacao.toISOString(),
            biometria: {
                id: usuarioAlterado.biometria.id,
            },
        }
    }

    async associateToken(email: string, token: string) {
        const usuario = await this.findOneByEmail(email)

        if (!usuario) {
            return
        }

        usuario.token_email = token

        await usuario.save()
    }
}
