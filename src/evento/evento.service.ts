import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import * as fs from 'fs'
import * as XLSX from 'xlsx'
import { EMailerService } from '../mailer/mailer.service'
import { UsuarioService } from '../usuario/usuario.service'
import { CheckInDto } from './dto/check-in.dto'
import { CreateEventoDto } from './dto/create-evento.dto'
import { UpdateEventoDto } from './dto/update-evento.dto'
import { Convidado } from './entities/convidado.entity'
import { StatusEvento } from './entities/evento.entity'
import { EventoRepository } from './evento.repository'

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
                dataEvento: new Date(eventoCriado.evento.dt_inicio_prevista),
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

                    const checkOutPendente = registrosCheckIn.registros.find((r) => r?.dt_hora_check_out == null)

                    if (checkOutPendente) {
                        await this.checkOut(id, { email_convidado: emailCheckIn, data: new Date() })
                    }

                    let tempoPermanencia = 0

                    if (checkOutPendente?.dt_hora_check_in != null) {
                        tempoPermanencia = Math.abs(
                            new Date(checkOutPendente?.dt_hora_check_in).getTime() - new Date().getTime(),
                        )
                    }

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

        return await this.eventoRepository.checkIn(
            convidado.id_evento,
            convidado,
            checkInDto.data,
            checkInDto.porcentagem_presenca,
        )
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

    async getPresentes(idEvento: string) {
        if (!idEvento) {
            throw new BadRequestException('Informe o ID do evento para realizar a busca dos presentes')
        }

        const evento = await this.eventoRepository.findById(idEvento)

        if (!evento) {
            throw new NotFoundException(`Evento não encontrado com o ID informado: ${idEvento}`)
        }

        if (evento.evento.status != StatusEvento.FINALIZADO) {
            throw new BadRequestException('Não é possível visualizar os presentes de um evento não finalizado')
        }

        const presentes = []
        const ausentes = []

        for (const email of evento.evento.check_ins.emails) {
            const registrosCheckIn = await this.getRegistrosCheckIn(idEvento, email)

            if (registrosCheckIn.registros.length === 0) {
                continue
            }

            let tempoPermanencia = 0
            for (const registro of registrosCheckIn.registros) {
                if (registro.dt_hora_check_in && registro.dt_hora_check_out) {
                    tempoPermanencia +=
                        new Date(registro.dt_hora_check_out).getTime() - new Date(registro.dt_hora_check_in).getTime()
                }
            }

            // Convert tempoPermanencia from milliseconds to hours and minutes
            const totalMinutes = Math.floor(tempoPermanencia / 60000)
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60
            const formattedPermanencia = `${hours}h${minutes}m`

            const presente = {
                email: email,
                permanencia: formattedPermanencia,
            }

            presentes.push(presente)
        }

        // TODO: colocar presente em ordem alfabética pelo email
        // TODO: colocar presente em ordem alfabética pelo email
        const presentesOrdenados = presentes.sort((a, b) => a.email.localeCompare(b.email))

        for (const email of evento.evento.convidados.emails) {
            if (!presentes.find((p) => p.email === email)) {
                ausentes.push(email)
            }
        }

        const response = {
            presentes: presentesOrdenados,
            ausentes: ausentes,
        }

        return response
    }

    async getListaConvidadosByNomeEvento(nomeEvento: string) {
        return await this.eventoRepository.getListaConvidadosByNomeEvento(nomeEvento)
    }

    async generateReport(idEvento: string) {
        // TODO: Gerar uma planilha com o email do convidado, e todos os check-ins e check-outs realizados, além do tempo de permanência numa coluna separada.
        // TODO: Para gerar a planilha, pegar o usuário que mais fez check-in e check-out, dessa forma, será possível determinar quantas colunas de check-in e check-out serão necessárias.
        // TODO: O tempo de permanência deve ser calculado em horas e minutos.
        // TODO: O arquivo deve ser salvo no formato .xlsx e enviado por e-mail para o organizador do evento.
        if (!idEvento) {
            throw new BadRequestException('Informe o ID do evento para gerar o relatório')
        }

        const evento = await this.eventoRepository.findById(idEvento)

        if (!evento) {
            throw new NotFoundException(`Evento não encontrado com o ID informado: ${idEvento}`)
        }

        if (evento.evento.status !== StatusEvento.FINALIZADO) {
            throw new BadRequestException('Não é possível gerar um relatório de um evento que não foi finalizado')
        }

        const registros = []
        const emails = new Set(evento.evento.check_ins.emails)
        let maxCheckIns = 0

        for (const email of emails) {
            const registrosCheckIn = await this.getRegistrosCheckIn(idEvento, email)
            const checkIns = registrosCheckIn.registros.map((registro) => ({
                checkIn: registro.dt_hora_check_in,
                checkOut: registro.dt_hora_check_out,
            }))

            if (checkIns.length > maxCheckIns) {
                maxCheckIns = checkIns.length
            }

            let tempoPermanencia = 0
            for (const registro of registrosCheckIn.registros) {
                if (registro.dt_hora_check_in && registro.dt_hora_check_out) {
                    tempoPermanencia +=
                        new Date(registro.dt_hora_check_out).getTime() - new Date(registro.dt_hora_check_in).getTime()
                }
            }

            const totalMinutes = Math.floor(tempoPermanencia / 60000)
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60
            const formattedPermanencia = `${hours}h${minutes}m`

            registros.push({
                email: email,
                checkIns: checkIns,
                permanencia: formattedPermanencia,
            })
        }

        const worksheetData = []
        const header = ['Email']
        for (let i = 1; i <= maxCheckIns; i++) {
            header.push(`Check-in ${i}`, `Check-out ${i}`)
        }
        header.push('Tempo de Permanência')
        worksheetData.push(header)

        for (const registro of registros) {
            const row = [registro.email]
            for (const checkIn of registro.checkIns) {
                row.push(checkIn.checkIn || '', checkIn.checkOut || '')
            }
            while (row.length < header.length - 1) {
                row.push('', '')
            }
            row.push(registro.permanencia)
            worksheetData.push(row)
        }

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório')
        const filePath = `./reports/relatorio_${idEvento}.xlsx`
        XLSX.writeFile(workbook, filePath)

        // Convert the file to base64
        const fileContent = fs.readFileSync(filePath)
        const base64File = fileContent.toString('base64')

        this.mailerService.sendMailRelatorioEventoGerado({
            nomeEvento: evento.evento.nome,
            dataEvento: evento.evento.dt_inicio_prevista,
            emailOrganizador: evento.evento.cpf_organizador,
            fileName: `relatorio_${idEvento}.xlsx`,
            file: base64File,
        })

        return true
    }
}
