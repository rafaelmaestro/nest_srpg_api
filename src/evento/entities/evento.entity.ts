import { Convidado } from './convidado.entity'

export enum StatusEvento {
    PENDENTE = 'PENDENTE',
    EM_ANDAMENTO = 'EM ANDAMENTO',
    FINALIZADO = 'FINALIZADO',
    CANCELADO = 'CANCELADO',
}

export class Evento {
    id?: string
    nome: string
    descricao: string
    data_hora: Date
    status: string
    latitude?: string
    longitude?: string
    dt_inicio?: Date
    dt_fim?: Date
    local: string
    cpf_organizador: string
    endereco: Convidado[]
}
