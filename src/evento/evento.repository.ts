import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ulid } from 'ulid'
import { CreateEventoDto } from './dto/create-evento.dto'
import { ConvidadoEventoModel } from './models/convidado-evento.model'
import { EventoModel } from './models/evento.model'

@Injectable()
export class EventoRepository {
    constructor(private readonly dataSource: DataSource) {}

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
            }

            const eventoCriado = await queryRunner.manager.save(EventoModel, eventoParaSalvar)

            await queryRunner.commitTransaction()
            return {
                evento: {
                    id: eventoCriado.id,
                    nome: eventoCriado.nome,
                    descricao: eventoCriado.descricao,
                    data_hora: eventoCriado.data_hora,
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
}
