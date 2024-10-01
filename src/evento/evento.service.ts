import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { UsuarioService } from '../usuario/usuario.service'
import { CreateEventoDto } from './dto/create-evento.dto'
import { EventoRepository } from './evento.repository'
import { StatusEvento } from './entities/evento.entity'
import { UpdateEventoDto } from './dto/update-evento.dto'
import { stat } from 'fs'
import { Convidado } from './entities/convidado.entity'
import e from 'express'
import { CheckInDto } from './dto/check-in.dto'
import { EMailerService } from '../mailer/mailer.service'

@Injectable()
export class EventoService {
    constructor(
        private readonly eventoRepository: EventoRepository,
        private readonly usuarioService: UsuarioService,
        private readonly mailerService: EMailerService,
    ) {}
    async create(createEventoDto: CreateEventoDto) {
        const usuario = await this.usuarioService.findByCpf(createEventoDto.cpf_organizador)

        if (!usuario) {
            throw new NotFoundException(
                `Usuário não encontrado com o CPF informado: ${createEventoDto.cpf_organizador}`,
            )
        }

        createEventoDto.status = StatusEvento.PENDENTE
        createEventoDto.dt_inicio = undefined
        createEventoDto.dt_fim = undefined

        const eventoCriado = await this.eventoRepository.save(createEventoDto)

        if (eventoCriado) {
            this.mailerService.sendMailConvidado({
                nomeEvento: eventoCriado.evento.nome,
                localEvento: eventoCriado.evento.local,
                dataEvento: eventoCriado.evento.dt_inicio_prevista,
                descricaoEvento: eventoCriado.evento.descricao,
                nomeOrganizador: usuario.nome,
                emailsDestinatarios: eventoCriado.evento.convidados.emails,
            })

            return eventoCriado
        }
    }

    async getRegistrosCheckIn(id_evento: string, email_convidado: string) {
        if (!id_evento) {
            throw new BadRequestException('Informe o ID do evento para realizar a busca dos registros de check-in')
        }

        if (!email_convidado) {
            throw new BadRequestException('Informe o e-mail do usuário para realizar a busca dos registros de check-in')
        }

        return await this.eventoRepository.getRegistrosCheckIn(id_evento, email_convidado)
    }

    async update(id: string, updateEventoDto: UpdateEventoDto) {
        if (updateEventoDto.dt_fim != null && updateEventoDto.dt_inicio != null) {
            if (updateEventoDto.dt_fim < updateEventoDto.dt_inicio) {
                throw new BadRequestException('Data de fim do evento não pode ser menor que a data de início')
            }

            if (updateEventoDto.dt_fim === updateEventoDto.dt_inicio) {
                throw new BadRequestException('Data de início e fim do evento não podem ser iguais')
            }
        }

        const evento = await this.eventoRepository.findById(id)

        if (!evento) {
            throw new NotFoundException(`Evento não encontrado com o ID informado: ${id}`)
        }

        const statusEvento: StatusEvento = StatusEvento[updateEventoDto.status]
        updateEventoDto.status = statusEvento

        if (updateEventoDto.status && !Object.values(StatusEvento).includes(statusEvento)) {
            throw new BadRequestException(
                'Status informado não é válido, utilize: PENDENTE, EM ANDAMENTO, PAUSADO, FINALIZADO ou CANCELADO',
            )
        }

        if (evento.evento.status === StatusEvento.FINALIZADO || evento.evento.status === StatusEvento.CANCELADO) {
            throw new BadRequestException('Não é possível alterar um evento que já foi finalizado ou cancelado')
        }

        if (evento.evento.status === StatusEvento.EM_ANDAMENTO) {
            if (updateEventoDto.status === StatusEvento.PENDENTE) {
                throw new BadRequestException('Não é possível voltar um evento em andamento para pendente')
            }
            if (updateEventoDto.status === StatusEvento.EM_ANDAMENTO) {
                throw new BadRequestException('O evento já está em andamento')
            }
        }

        if (updateEventoDto.status === StatusEvento.EM_ANDAMENTO && evento.evento.status != StatusEvento.PAUSADO) {
            if (updateEventoDto.latitude == null || updateEventoDto.longitude == null) {
                throw new BadRequestException('Informe a latitude e longitude para iniciar o evento')
            }

            updateEventoDto.dt_inicio = new Date()
        }

        if (updateEventoDto.status === StatusEvento.FINALIZADO) {
            updateEventoDto.dt_fim = new Date()
        }

        const eventoAtualizado = await this.eventoRepository.update(id, updateEventoDto)

        if (eventoAtualizado) {
            if (
                eventoAtualizado.evento.status === StatusEvento.EM_ANDAMENTO &&
                evento.evento.status === StatusEvento.PENDENTE
            ) {
                this.mailerService.sendMailEventoAtualizado({
                    statusEvento: 'INICIADO',
                    localEvento: eventoAtualizado.evento.local,
                    nomeEvento: eventoAtualizado.evento.nome,
                    dataAtualizacao: new Date(),
                    emailsNotificados: eventoAtualizado.evento.convidados.emails,
                })
            }

            if (
                eventoAtualizado.evento.status === StatusEvento.FINALIZADO &&
                evento.evento.status !== (StatusEvento.FINALIZADO as StatusEvento)
            ) {
                for (const emailCheckIn of evento.evento.check_ins.emails) {
                    const registrosCheckIn = await this.getRegistrosCheckIn(id, emailCheckIn)

                    if (registrosCheckIn.registros.length === 0) {
                        continue
                    }

                    const checkOutPendente = registrosCheckIn.registros.find((r) => r.dt_hora_check_out == null)

                    if (checkOutPendente) {
                        await this.checkOut(id, { email_convidado: emailCheckIn, data: new Date() })
                    }

                    const tempoPermanencia = Math.abs(
                        new Date(checkOutPendente.dt_hora_check_in).getTime() - new Date().getTime(),
                    )

                    this.mailerService.sendMailEventoAtualizado({
                        statusEvento: 'FINALIZADO',
                        localEvento: eventoAtualizado.evento.local,
                        nomeEvento: eventoAtualizado.evento.nome,
                        dataAtualizacao: new Date(),
                        emailsNotificados: [emailCheckIn],
                        tempoPermanencia: tempoPermanencia,
                    })
                }
            }

            if (eventoAtualizado.evento.status === StatusEvento.CANCELADO) {
                this.mailerService.sendMailEventoAtualizado({
                    statusEvento: 'CANCELADO',
                    localEvento: eventoAtualizado.evento.local,
                    nomeEvento: eventoAtualizado.evento.nome,
                    dataAtualizacao: new Date(),
                    emailsNotificados: eventoAtualizado.evento.convidados.emails,
                })
            }

            if (eventoAtualizado.evento.status === StatusEvento.PAUSADO) {
                this.mailerService.sendMailEventoAtualizado({
                    statusEvento: 'PAUSADO',
                    localEvento: eventoAtualizado.evento.local,
                    nomeEvento: eventoAtualizado.evento.nome,
                    dataAtualizacao: new Date(),
                    emailsNotificados: eventoAtualizado.evento.convidados.emails,
                })
            }

            if (
                eventoAtualizado.evento.status === StatusEvento.EM_ANDAMENTO &&
                evento.evento.status === StatusEvento.PAUSADO
            ) {
                this.mailerService.sendMailEventoAtualizado({
                    statusEvento: 'RETOMADO',
                    localEvento: eventoAtualizado.evento.local,
                    nomeEvento: eventoAtualizado.evento.nome,
                    dataAtualizacao: new Date(),
                    emailsNotificados: eventoAtualizado.evento.convidados.emails,
                })
            }
        }
        return eventoAtualizado
    }

    async findOneById(id: string) {
        return await this.eventoRepository.findById(id)
    }

    async remove(id: string) {
        return await this.eventoRepository.remove(id)
    }

    async find({ status, nome, pagina, limite, cpf_convidado, cpf_organizador }) {
        if (!status && !nome && !pagina && !limite && !cpf_convidado && !cpf_organizador) {
            throw new BadRequestException(
                'Informe ao menos um parâmetro para a busca: status, nome ou pagina e limite!',
            )
        }

        if (status) {
            status.split(',').forEach((s) => {
                if (!Object.values(StatusEvento).includes(s.toUpperCase().trim())) {
                    throw new BadRequestException(
                        'Status informado não é válido, utilize: PENDENTE, EM ANDAMENTO, PAUSADO, FINALIZADO ou CANCELADO',
                    )
                }
            })
        }

        if (pagina && (isNaN(Number(pagina)) || pagina < 0 || pagina == 0)) {
            throw new BadRequestException('Página informada não é um número válido')
        }

        if (limite && isNaN(Number(limite))) {
            throw new BadRequestException('Limite informado não é um número válido')
        }

        if (pagina && !limite) {
            throw new BadRequestException('Informe o parâmetro limite para a paginação')
        }

        if (limite && !pagina) {
            throw new BadRequestException('Informe o parâmetro pagina para a paginação')
        }

        return await this.eventoRepository.find({ status, nome, pagina, limite, cpf_convidado, cpf_organizador })
    }

    async checkIn(id: string, checkInDto: CheckInDto) {
        if (!id) {
            throw new BadRequestException('Informe o ID do evento para realizar o check-in')
        }

        if (!checkInDto.email_convidado) {
            throw new BadRequestException('Informe o e-mail do usuário para realizar o check-in')
        }

        const evento = await this.eventoRepository.findById(id)

        if (!evento) {
            throw new NotFoundException(`Evento não encontrado com o ID informado: ${id}`)
        }

        const convidado = new Convidado()
        convidado.email_convidado = checkInDto.email_convidado
        convidado.id_evento = id

        return await this.eventoRepository.checkIn(convidado.id_evento, convidado, checkInDto.data)
    }

    async checkOut(id: string, checkInDto: CheckInDto) {
        if (!id) {
            throw new BadRequestException('Informe o ID do evento para realizar o check-out')
        }

        if (!checkInDto.email_convidado) {
            throw new BadRequestException('Informe o e-mail do usuário para realizar o check-out')
        }

        const evento = await this.eventoRepository.findById(id)

        if (!evento) {
            throw new NotFoundException(`Evento não encontrado com o ID informado: ${id}`)
        }

        const convidado = new Convidado()
        convidado.email_convidado = checkInDto.email_convidado
        convidado.id_evento = id

        return await this.eventoRepository.checkOut(convidado.id_evento, convidado, checkInDto.data)
    }
}
