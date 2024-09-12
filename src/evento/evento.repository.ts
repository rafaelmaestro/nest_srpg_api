import { Injectable, NotFoundException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ulid } from 'ulid'
import { CreateEventoDto } from './dto/create-evento.dto'
import { ConvidadoEventoModel } from './models/convidado-evento.model'
import { EventoModel } from './models/evento.model'
import { UpdateEventoDto } from './dto/update-evento.dto'
import { StatusEvento } from './entities/evento.entity'
import { Convidado } from './entities/convidado.entity'
import { UsuarioRepository } from '../usuario/usuario.repository'

@Injectable()
export class EventoRepository {
    constructor(
        private readonly dataSource: DataSource,
        private readonly usuarioRepository: UsuarioRepository,
    ) {}

    async save(evento: CreateEventoDto) {
        const queryRunner = this.dataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()
        try {
            const convidadosModelArray: ConvidadoEventoModel[] = []

            if (evento.convidados && evento.convidados.length > 0) {
                for (const convidado of evento.convidados) {
                    const convidadoModel = new ConvidadoEventoModel().build({
                        email: convidado,
                        id_evento: evento.id,
                    })

                    convidadosModelArray.push(convidadoModel)
                }
            }

            const eventoParaSalvar = {
                ...evento,
                id: ulid(),
                convidados: convidadosModelArray,
                status: StatusEvento.PENDENTE,
            }

            const eventoCriado = await queryRunner.manager.save(EventoModel, eventoParaSalvar)

            await queryRunner.commitTransaction()
            return {
                evento: {
                    id: eventoCriado.id,
                    nome: eventoCriado.nome,
                    descricao: eventoCriado.descricao,
                    data_inicio_prevista: eventoCriado.data_inicio_prevista,
                    data_fim_prevista: eventoCriado.data_fim_prevista,
                    latitude: eventoCriado.latitude,
                    longitude: eventoCriado.longitude,
                    local: eventoCriado.local,
                    cpf_organizador: eventoCriado.cpf_organizador,
                    convidados: eventoCriado.convidados.map((convidado) => convidado.email),
                },
            }
        } catch (error) {
            await queryRunner.rollbackTransaction()
            throw error
        } finally {
            await queryRunner.release()
        }
    }

    async findById(id: string) {
        const evento = await this.dataSource.getRepository(EventoModel).findOne({
            where: {
                id,
            },
        })

        if (!evento) {
            throw new NotFoundException(`Evento não encontrado com o ID informado: ${id}`)
        }

        return {
            ...evento,
            latitude: evento.latitude || undefined,
            longitude: evento.longitude || undefined,
            dt_inicio: evento.dt_inicio || undefined,
            dt_fim: evento.dt_fim || undefined,
            convidados: {
                total: evento.convidados.length,
                emails: evento.convidados.map((convidado) => convidado.email),
            },
            check_ins: {
                total: evento.convidados.filter((convidado) => convidado.dt_hora_check_in).length,
                emails: evento.convidados
                    .filter((convidado) => convidado.dt_hora_check_in)
                    .map((convidado) => convidado.email),
            },
            check_outs: {
                total: evento.convidados.filter((convidado) => convidado.dt_hora_check_out).length,
                emails: evento.convidados
                    .filter((convidado) => convidado.dt_hora_check_out)
                    .map((convidado) => convidado.email),
            },
        }
    }

    async update(id: string, updateEventoDto: UpdateEventoDto) {
        try {
            const values = {}

            if (updateEventoDto.nome) {
                values['nome'] = updateEventoDto.nome
            }

            if (updateEventoDto.descricao) {
                values['descricao'] = updateEventoDto.descricao
            }

            if (updateEventoDto.dt_inicio_prevista) {
                values['dt_inicio_prevista'] = updateEventoDto.dt_inicio_prevista
            }

            if (updateEventoDto.dt_fim_prevista) {
                values['dt_fim_prevista'] = updateEventoDto.dt_fim_prevista
            }

            if (updateEventoDto.latitude) {
                values['latitude'] = updateEventoDto.latitude
            }

            if (updateEventoDto.longitude) {
                values['longitude'] = updateEventoDto.longitude
            }

            if (updateEventoDto.local) {
                values['local'] = updateEventoDto.local
            }

            if (updateEventoDto.convidados) {
                const queryRunner = this.dataSource.createQueryRunner()
                await queryRunner.connect()
                await queryRunner.startTransaction()

                await queryRunner.manager.delete(ConvidadoEventoModel, { id_evento: id })

                const convidadoModelArray = []
                for (const convidado of updateEventoDto.convidados) {
                    const convidadoModel = new ConvidadoEventoModel().build({
                        email: convidado,
                        id_evento: id,
                    })

                    convidadoModelArray.push(convidadoModel)
                }

                try {
                    await queryRunner.manager.save(ConvidadoEventoModel, convidadoModelArray)
                    await queryRunner.commitTransaction()
                } catch (err) {
                    await queryRunner.rollbackTransaction()
                    throw new Error(err)
                } finally {
                    await queryRunner.release()
                }
            }

            if (updateEventoDto.status) {
                values['status'] = updateEventoDto.status
            }

            if (updateEventoDto.dt_fim) {
                values['dt_fim'] = updateEventoDto.dt_fim
            }

            if (updateEventoDto.dt_inicio) {
                values['dt_inicio'] = updateEventoDto.dt_inicio
            }

            await this.dataSource.getRepository(EventoModel).update(id, values)

            return await this.findById(id)
        } catch (err) {
            throw new Error(err)
        }
    }

    async remove(id: string) {
        const evento = await this.findById(id)

        if (!evento) {
            throw new NotFoundException(`Evento não encontrado com o ID informado: ${id}`)
        }

        await this.dataSource.getRepository(EventoModel).delete(id)
    }

    async find({ status, nome, pagina, limite, cpf_convidado, cpf_organizador }) {
        const query = this.dataSource.getRepository(EventoModel).createQueryBuilder('evento')

        if (nome) {
            query.andWhere('evento.nome LIKE :nome', { nome: `%${nome}%` })
        }

        if (cpf_convidado) {
            const usuario = await this.usuarioRepository.findOneByCpf(cpf_convidado)

            if (!usuario) {
                throw new NotFoundException('Usuário informado como convidado não encontrado')
            }

            query.leftJoin('evento.convidados', 'convidado')
            query.orWhere('convidado.email = :email', { email: usuario.email })
        }

        if (cpf_organizador) {
            query.orWhere('evento.cpf_organizador = :cpf_organizador', { cpf_organizador })
        }

        if (status) {
            const statusEnviados = status.split(',').map((status) => status.toUpperCase().trim())

            console.log('statusEnviados:', statusEnviados)

            query.andWhere('evento.status IN (:...status)', { status: statusEnviados })
        }

        const total = await query.getCount()

        if (pagina && limite) {
            query.skip((pagina - 1) * limite)
            query.take(limite)
        }

        const eventos = await query.getMany()

        return {
            eventos: [
                eventos.map((evento) => ({
                    ...evento,
                    convidados: {
                        total: evento.convidados ? evento.convidados.length : 0,
                        emails: evento.convidados ? evento.convidados.map((convidado) => convidado.email) : [],
                    },
                    check_ins: {
                        total: evento.convidados
                            ? evento.convidados.filter((convidado) => convidado.dt_hora_check_in).length
                            : 0,
                        emails: evento.convidados
                            ? evento.convidados
                                  .filter((convidado) => convidado.dt_hora_check_in)
                                  .map((convidado) => convidado.email)
                            : [],
                    },
                    check_outs: {
                        total: evento.convidados
                            ? evento.convidados.filter((convidado) => convidado.dt_hora_check_out).length
                            : 0,
                        emails: evento.convidados
                            ? evento.convidados
                                  .filter((convidado) => convidado.dt_hora_check_out)
                                  .map((convidado) => convidado.email)
                            : [],
                    },
                })),
            ],
            paginacao: {
                pagina: Number(pagina),
                limite: Number(limite),
                total: total,
            },
        }
    }

    async checkIn(id_evento: string, convidado: Convidado) {
        const convidadoModel = await this.dataSource.getRepository(ConvidadoEventoModel).findOne({
            where: {
                id_evento: id_evento,
                email: convidado.email_convidado,
            },
        })

        if (!convidadoModel) {
            throw new NotFoundException('Convidado não encontrado nesse evento para realizar o check-in')
        }

        if (convidadoModel.dt_hora_check_in) {
            throw new Error('Check-in já realizado para esse convidado')
        }

        await this.dataSource.getRepository(ConvidadoEventoModel).update(
            {
                id_evento: id_evento,
                email: convidado.email_convidado,
            },
            {
                dt_hora_check_in: convidado.dt_hora_check_in,
            },
        )

        return {
            Message: 'Check-in realizado com sucesso!',
            Data: convidado.dt_hora_check_in,
        }
    }

    async checkOut(id_evento: string, convidado: Convidado) {
        const convidadoModel = await this.dataSource.getRepository(ConvidadoEventoModel).findOne({
            where: {
                id_evento: id_evento,
                email: convidado.email_convidado,
            },
        })

        if (!convidadoModel) {
            throw new NotFoundException('Convidado não encontrado nesse evento para realizar o check-out')
        }

        if (!convidadoModel.dt_hora_check_in) {
            throw new Error('Check-in não realizado para esse convidado')
        }

        if (convidadoModel.dt_hora_check_out) {
            throw new Error('Check-out já realizado para esse convidado')
        }

        await this.dataSource.getRepository(ConvidadoEventoModel).update(
            {
                id_evento: id_evento,
                email: convidado.email_convidado,
            },
            {
                dt_hora_check_out: convidado.dt_hora_check_out,
            },
        )

        return {
            Message: 'Check-out realizado com sucesso!',
            Data: convidado.dt_hora_check_out,
        }
    }
}
