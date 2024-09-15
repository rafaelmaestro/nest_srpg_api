import { IsDateString, IsEnum, IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator'
import { Evento, StatusEvento } from '../entities/evento.entity'

export class CreateEventoDto extends Evento {
    @IsString()
    nome: string

    @IsString()
    descricao: string

    @IsDateString()
    dt_inicio_prevista: Date

    @IsDateString()
    dt_fim_prevista: Date

    @IsOptional()
    @IsLatitude()
    latitude: string

    @IsOptional()
    @IsLongitude()
    longitude: string

    @IsOptional()
    status: StatusEvento

    @IsString()
    local: string

    @IsString()
    cpf_organizador: string

    @IsString({ each: true })
    convidados: string[]
}
