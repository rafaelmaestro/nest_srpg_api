import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ulid } from 'ulid'
import { CreateUsuarioDto } from './dto/create-usuario.dto'
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
                    telefone: usuarioCriado.telefone,
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
}
