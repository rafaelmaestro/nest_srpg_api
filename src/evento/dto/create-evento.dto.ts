import { IsDateString, IsLatitude, IsLongitude, IsString } from 'class-validator'
import { Evento } from '../entities/evento.entity'

export class CreateEventoDto extends Evento {
    @IsString()
    nome: string

    @IsString()
    descricao: string

    @IsDateString()
    data_hora: Date

    @IsLatitude()
    latitude: string

    @IsLongitude()
    longitude: string

    @IsString()
    local: string

    @IsString()
    cpf_organizador: string

    @IsString({ each: true })
    convidados: string[]
}
