import { IsDateString, IsEnum, IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator'
import { Evento, StatusEvento } from '../entities/evento.entity'

export class CreateEventoDto extends Evento {
    @IsString()
    nome: string

    @IsString()
    descricao: string

    @IsDateString()
    data_hora: Date

    @IsOptional()
    @IsLatitude()
    latitude: string

    @IsOptional()
    @IsLongitude()
    longitude: string

    @IsOptional()
    @IsDateString()
    dt_inicio: Date

    @IsOptional()
    @IsDateString()
    dt_fim: Date

    @IsOptional()
    status: string

    @IsString()
    local: string

    @IsString()
    cpf_organizador: string

    @IsString({ each: true })
    convidados: string[]
}
