import { Convidado } from './convidado.entity'

export enum StatusEvento {
    PENDENTE = 'PENDENTE',
    EM_ANDAMENTO = 'EM_ANDAMENTO',
    FINALIZADO = 'FINALIZADO',
    CANCELADO = 'CANCELADO',
    PAUSADO = 'PAUSADO',
}

export class Evento {
    id?: string
    nome: string
    descricao: string
    data_inicio_prevista: Date
    data_fim_prevista: Date
    status: string
    latitude?: string
    longitude?: string
    dt_inicio?: Date
    dt_fim_prevista?: Date
    dt_fim?: Date
    local: string
    cpf_organizador: string
    endereco: Convidado[]
}
