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

@Injectable()
export class EventoService {
    constructor(
        private readonly eventoRepository: EventoRepository,
        private readonly usuarioService: UsuarioService,
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
            // TODO: Implementar envio de e-mail para os convidados
        }

        return eventoCriado
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
                'Status informado não é válido, utilize: PENDENTE, EM ANDAMENTO, FINALIZADO ou CANCELADO',
            )
        }

        if (evento.status === StatusEvento.FINALIZADO || evento.status === StatusEvento.CANCELADO) {
            throw new BadRequestException('Não é possível alterar um evento que já foi finalizado ou cancelado')
        }

        if (updateEventoDto.status === StatusEvento.EM_ANDAMENTO) {
            updateEventoDto.dt_inicio = new Date()
        }

        if (updateEventoDto.status === StatusEvento.FINALIZADO) {
            updateEventoDto.dt_fim = new Date()
        }

        const eventoAtualizado = await this.eventoRepository.update(id, updateEventoDto)

        if (eventoAtualizado) {
            // TODO: implementar envio de notificação para os convidados
        }

        return eventoAtualizado
    }

    async findOneById(id: string) {
        return await this.eventoRepository.findById(id)
    }

    async remove(id: string) {
        return await this.eventoRepository.remove(id)
    }

    async find({ status, nome, pagina, limite }) {
        if (!status && !nome && !pagina && !limite) {
            throw new BadRequestException(
                'Informe ao menos um parâmetro para a busca: status, nome ou pagina e limite!',
            )
        }

        if (status && !Object.values(StatusEvento).includes(status)) {
            throw new BadRequestException(
                'Status informado não é válido, utilize: PENDENTE, EM ANDAMENTO, FINALIZADO ou CANCELADO',
            )
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

        return await this.eventoRepository.find({ status, nome, pagina, limite })
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

        if (evento.status !== StatusEvento.EM_ANDAMENTO) {
            throw new BadRequestException('Check-in não permitido, o evento não está em andamento')
        }

        const convidado = new Convidado()
        convidado.email_convidado = checkInDto.email_convidado
        convidado.id_evento = id
        convidado.dt_hora_check_in = new Date()

        return await this.eventoRepository.checkIn(convidado.id_evento, convidado)
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

        if (evento.status !== StatusEvento.EM_ANDAMENTO) {
            throw new BadRequestException('Check-out não permitido, o evento não está em andamento')
        }

        const convidado = new Convidado()
        convidado.email_convidado = checkInDto.email_convidado
        convidado.id_evento = id
        convidado.dt_hora_check_out = new Date()

        return await this.eventoRepository.checkOut(convidado.id_evento, convidado)
    }
}
