import { Convidado } from './convidado.entity'

export class Evento {
    id?: string
    nome: string
    descricao: string
    data_hora: Date
    latitude: string
    longitude: string
    local: string
    cpf_organizador: string
    endereco: Convidado[]
}
