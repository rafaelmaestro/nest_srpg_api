import { BadRequestException, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ulid } from 'ulid'
import { CreateUsuarioDto } from './dto/create-usuario.dto'
import { UsuarioExistenteError } from './errors/usuario-existente.error'
import { BiometriaUsuarioModel } from './models/biometria.model'
import { UsuarioModel } from './models/usuario.model'
import { UpdateUsuarioDto } from './dto/update-usuario.dto'

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
                throw new UsuarioExistenteError()
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
        const usuario = await UsuarioModel.findOne({ where: { cpf }, relations: ['biometria'] })

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

    async setHashRecuperacaoSenha(email: string, senha: string) {
        const usuario = await this.findOneByEmail(email)

        if (!usuario) {
            return
        }

        usuario.hash_recuperacao_senha = senha

        await usuario.save()
    }

    async updateUsuario(updateUsuarioDto: UpdateUsuarioDto) {
        let usuario: UsuarioModel = null

        if (updateUsuarioDto.cpf) {
            usuario = await this.findOneByCpfWithBiometria(updateUsuarioDto.cpf)
        } else {
            usuario = await this.findOneByEmailWithBiometria(updateUsuarioDto.email)
        }

        if (!usuario) {
            throw new BadRequestException('Usuário não encontrado')
        }

        if (updateUsuarioDto.email) {
            usuario.email = updateUsuarioDto.email
        }

        if (updateUsuarioDto.foto) {
            usuario.biometria.foto = updateUsuarioDto.foto
        }

        if (updateUsuarioDto.senha) {
            usuario.senha = updateUsuarioDto.senha
        }

        const usuarioAlterado = await usuario.save()

        return {
            usuario: {
                cpf: usuarioAlterado.cpf,
                nome: usuarioAlterado.nome,
                email: usuarioAlterado.email,
            },
            biometria: {
                id: usuarioAlterado.biometria.id,
            },
        }
    }
}
