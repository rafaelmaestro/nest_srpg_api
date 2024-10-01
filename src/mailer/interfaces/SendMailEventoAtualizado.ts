import { StatusEvento } from '../../evento/entities/evento.entity'

export interface SendMailEventoAtualizado {
    statusEvento: string
    localEvento: string
    nomeEvento: string
    dataAtualizacao: Date
    emailsNotificados: string[]
    tempoPermanencia?: number
}
