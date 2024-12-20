import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { DataSource, ILike } from 'typeorm'
import { ulid } from 'ulid'
import { UsuarioRepository } from '../usuario/usuario.repository'
import { CreateEventoDto } from './dto/create-evento.dto'
import { UpdateEventoDto } from './dto/update-evento.dto'
import { Convidado } from './entities/convidado.entity'
import { StatusEvento } from './entities/evento.entity'
import { CheckInsModel } from './models/check-ins.model'
import { ConvidadoEventoModel } from './models/convidado-evento.model'
import { EventoModel } from './models/evento.model'

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
                        check_ins: [],
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
                    status: eventoCriado.status,
                    descricao: eventoCriado.descricao,
                    distancia_maxima_permitida: eventoCriado.distancia_maxima_permitida,
                    minutos_tolerancia: eventoCriado.minutos_tolerancia,
                    dt_inicio_prevista: eventoCriado.dt_inicio_prevista,
                    dt_fim_prevista: eventoCriado.dt_fim_prevista,
                    local: eventoCriado.local,
                    latitude: eventoCriado.latitude,
                    longitude: eventoCriado.longitude,
                    cpf_organizador: eventoCriado.cpf_organizador,
                    dt_criacao: eventoCriado.dt_criacao,
                    dt_ult_atualizacao: eventoCriado.dt_ult_atualizacao,
                    check_ins: {
                        total: 0,
                        emails: [],
                    },
                    check_outs: {
                        total: 0,
                        emails: [],
                    },
                    convidados: {
                        total: eventoCriado.convidados.length,
                        emails: eventoCriado.convidados.map((convidado) => convidado.email),
                    },
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

        const checkInEmails = new Set<string>()
        const checkOutEmails = new Set<string>()

        evento.convidados.forEach((convidado) => {
            if (convidado.check_ins) {
                convidado.check_ins.forEach((check_in) => {
                    if (check_in.dt_hora_check_in) {
                        checkInEmails.add(convidado.email)
                    }
                    if (check_in.dt_hora_check_out) {
                        checkOutEmails.add(convidado.email)
                    }
                })
            }
        })

        return {
            evento: {
                ...evento,
                latitude: evento.latitude || null,
                longitude: evento.longitude || null,
                dt_inicio: evento.dt_inicio || null,
                dt_fim: evento.dt_fim || null,
                distancia_maxima_permitida: evento.distancia_maxima_permitida,
                minutos_tolerancia: evento.minutos_tolerancia,
                convidados: {
                    total: evento.convidados.length,
                    emails: evento.convidados.map((convidado) => convidado.email),
                },
                check_ins: {
                    total: evento.convidados.reduce(
                        (acc, convidado) => acc + (convidado.check_ins ? convidado.check_ins.length : 0),
                        0,
                    ),
                    emails: Array.from(checkInEmails),
                },
                check_outs: {
                    total: evento.convidados.reduce(
                        (acc, convidado) =>
                            acc +
                            (convidado.check_ins
                                ? convidado.check_ins.filter((check_in) => check_in.dt_hora_check_out).length
                                : 0),
                        0,
                    ),
                    emails: Array.from(checkOutEmails),
                },
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
                        check_ins: [],
                    })

                    convidadoModelArray.push(convidadoModel)
                }

                try {
                    await queryRunner.manager.save(ConvidadoEventoModel, convidadoModelArray)
                    await queryRunner.commitTransaction()
                } catch (err) {
                    await queryRunner.rollbackTransaction()
                    throw err
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
        const query = this.dataSource
            .getRepository(EventoModel)
            .createQueryBuilder('evento')
            .leftJoinAndSelect('evento.convidados', 'convidados')

        if (nome) {
            query.andWhere('evento.nome LIKE :nome', { nome: `%${nome}%` })
        }

        if (cpf_convidado) {
            const usuario = await this.usuarioRepository.findOneByCpf(cpf_convidado)

            query.leftJoin('evento.convidados', 'convidado')
            query.orWhere('convidado.email = :email', { email: usuario ? usuario.email : '' })
        }

        if (cpf_organizador) {
            query.orWhere('evento.cpf_organizador = :cpf_organizador', { cpf_organizador })
        }

        if (status) {
            const statusEnviados = status.split(',').map((status) => status.toUpperCase().trim())

            query.andWhere('evento.status IN (:...status)', { status: statusEnviados })
        }

        const total = await query.getCount()

        if (pagina && limite) {
            query.skip((pagina - 1) * limite)
            query.take(limite)
        }

        query.addOrderBy('evento.dt_inicio', 'DESC')
        query.addOrderBy('evento.dt_inicio_prevista', 'DESC')
        const eventos = await query.getMany()

        return {
            eventos: eventos.map((evento) => {
                const checkInEmails = new Set<string>()
                const checkOutEmails = new Set<string>()

                evento.convidados.forEach((convidado) => {
                    if (convidado.check_ins) {
                        convidado.check_ins.forEach((check_in) => {
                            if (check_in.dt_hora_check_in) {
                                checkInEmails.add(convidado.email)
                            }
                            if (check_in.dt_hora_check_out) {
                                checkOutEmails.add(convidado.email)
                            }
                        })
                    }
                })

                return {
                    ...evento,
                    dt_fim: evento.dt_fim ? this._subtractHours(evento.dt_fim, 3) : null,
                    dt_inicio: evento.dt_inicio ? this._subtractHours(evento.dt_inicio, 3) : null,
                    dt_inicio_prevista: this._subtractHours(evento.dt_inicio_prevista, 3),
                    dt_fim_prevista: this._subtractHours(evento.dt_fim_prevista, 3),
                    distancia_maxima_permitida: evento.distancia_maxima_permitida,
                    minutos_tolerancia: evento.minutos_tolerancia,
                    convidados: {
                        total: evento.convidados ? evento.convidados.length : 0,
                        emails: evento.convidados ? evento.convidados.map((convidado) => convidado.email) : [],
                    },
                    check_ins: {
                        total: evento.convidados.reduce(
                            (acc, convidado) =>
                                acc +
                                (convidado.check_ins
                                    ? convidado.check_ins.filter((check_in) => check_in.dt_hora_check_out).length
                                    : 0),
                            0,
                        ),
                        emails: Array.from(checkInEmails),
                    },
                    check_outs: {
                        total: evento.convidados.reduce(
                            (acc, convidado) =>
                                acc +
                                (convidado.check_ins
                                    ? convidado.check_ins.filter((check_in) => check_in.dt_hora_check_in).length
                                    : 0),
                            0,
                        ),
                        emails: Array.from(checkOutEmails),
                    },
                }
            }),
            paginacao: {
                pagina: Number(pagina),
                limite: Number(limite),
                total: total,
            },
        }
    }

    async getRegistrosCheckIn(id_evento: string, email_convidado: string) {
        const convidadoModel = await this.dataSource.getRepository(ConvidadoEventoModel).findOne({
            where: {
                id_evento: id_evento,
                email: email_convidado,
            },
        })

        if (!convidadoModel) {
            throw new NotFoundException('Convidado não encontrado nesse evento')
        }

        return {
            registros: convidadoModel.check_ins.map((checkIn) => {
                return {
                    id: checkIn.id,
                    dt_hora_check_in: this._subtractHours(checkIn.dt_hora_check_in, 3),
                    dt_hora_check_out: checkIn.dt_hora_check_out
                        ? this._subtractHours(checkIn.dt_hora_check_out, 3)
                        : null,
                }
            }),
        }
    }

    async checkIn(id_evento: string, convidado: Convidado, data?: Date, porcentagem_presenca?: number) {
        const dataCheckIn = data || new Date()
        const convidadoModel = await this.dataSource.getRepository(ConvidadoEventoModel).findOne({
            where: {
                id_evento: id_evento,
                email: convidado.email_convidado,
            },
        })

        if (!convidadoModel) {
            throw new NotFoundException('Convidado não encontrado nesse evento para realizar o check-in')
        }

        convidadoModel.check_ins?.find((check_in) => {
            if (check_in.dt_hora_check_in != null && check_in.dt_hora_check_out == null) {
                throw new BadRequestException('Check-in já realizado para esse convidado')
            }
        })

        const novoCheckInModel = new CheckInsModel()
        novoCheckInModel.id = ulid()

        if (porcentagem_presenca) {
            const evento = await this.findById(id_evento)

            if (!evento || evento.evento.status != StatusEvento.FINALIZADO) {
                throw new NotFoundException('Evento não encontrado, ou não está finalizado')
            }

            const duracaoEvento = evento.evento.dt_fim.getTime() - evento.evento.dt_inicio.getTime()

            const duracaoEventoEmMinutos = duracaoEvento / 60000

            const tempoPermancenciaConvidado = porcentagem_presenca * duracaoEventoEmMinutos

            novoCheckInModel.dt_hora_check_in = evento.evento.dt_inicio

            const dataCheckOut = new Date(evento.evento.dt_inicio.getTime() + tempoPermancenciaConvidado * 60000)

            novoCheckInModel.dt_hora_check_out = dataCheckOut
        } else {
            novoCheckInModel.dt_hora_check_in = dataCheckIn
        }

        convidadoModel.check_ins.push(novoCheckInModel)

        await this.dataSource.getRepository(ConvidadoEventoModel).update(
            {
                id_evento: id_evento,
                email: convidado.email_convidado,
            },
            {
                check_ins: [...convidadoModel.check_ins],
            },
        )

        return {
            registros: convidadoModel.check_ins.map((checkIn) => {
                return {
                    id: checkIn.id,
                    dt_hora_check_in: this._subtractHours(checkIn.dt_hora_check_in, 3),
                    dt_hora_check_out: checkIn.dt_hora_check_out
                        ? this._subtractHours(checkIn.dt_hora_check_out, 3)
                        : null,
                }
            }),
        }
    }

    async checkOut(id_evento: string, convidado: Convidado, data?: Date) {
        const dataCheckOut = data || new Date()
        const convidadoModel = await this.dataSource.getRepository(ConvidadoEventoModel).findOne({
            where: {
                id_evento: id_evento,
                email: convidado.email_convidado,
            },
        })

        if (!convidadoModel) {
            throw new NotFoundException('Convidado não encontrado nesse evento para realizar o check-out')
        }

        if (Array.isArray(convidadoModel.check_ins) && convidadoModel.check_ins.length === 0) {
            throw new BadRequestException('Check-in não realizado para esse convidado')
        }

        const checkOutPendente = convidadoModel.check_ins.find((checkIn) => {
            return (
                checkIn.dt_hora_check_in != null &&
                (checkIn.dt_hora_check_out == null || checkIn.dt_hora_check_out === undefined)
            )
        })

        if (checkOutPendente == null) {
            throw new BadRequestException('Check-out já realizado para esse convidado')
        }

        const checkOutIndex = convidadoModel.check_ins.findIndex((checkIn) => checkIn.id === checkOutPendente.id)

        convidadoModel.check_ins[checkOutIndex].dt_hora_check_out = dataCheckOut

        await this.dataSource.getRepository(ConvidadoEventoModel).update(
            {
                id_evento: id_evento,
                email: convidado.email_convidado,
            },
            {
                check_ins: [...convidadoModel.check_ins],
            },
        )

        return {
            registros: convidadoModel.check_ins.map((checkIn) => {
                return {
                    id: checkIn.id,
                    dt_hora_check_in: this._subtractHours(checkIn.dt_hora_check_in, 3),
                    dt_hora_check_out: checkIn.dt_hora_check_out
                        ? this._subtractHours(checkIn.dt_hora_check_out, 3)
                        : null,
                }
            }),
        }
    }

    async getListaConvidadosByNomeEvento(nomeEvento: string) {
        const eventos = await this.dataSource.getRepository(EventoModel).find({
            where: {
                nome: ILike(`%${nomeEvento}%`),
            },
            order: {
                dt_criacao: 'DESC',
            },
        })

        if (!eventos) {
            throw new NotFoundException('Evento não encontrado')
        }

        return {
            nome: eventos[0].nome ? eventos[0].nome : null,
            convidados: {
                total: eventos[0].convidados ? eventos[0].convidados.length : 0,
                emails: eventos[0].convidados ? eventos[0].convidados.map((convidado) => convidado.email) : [],
            },
        }
    }

    _subtractHours(date: Date, hours: number): Date {
        const newDate = new Date(date)
        newDate.setHours(newDate.getHours() - hours)
        return newDate
    }
}
