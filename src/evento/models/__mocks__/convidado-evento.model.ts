import { CheckInsModel } from '../check-ins.model'
import { ConvidadoEvento } from '../convidado-evento.model'

export const mockConvidadoModel = {
    criarConvidado1: () => {
        return {
            email: 'convidado1@email.com',
            id_evento: '01J9SQF9YP9RYVMB61RCAS2BS1',
            check_ins: [
                {
                    id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                    dt_hora_check_in: new Date('2024-10-10T01:48:02.000Z'),
                    dt_hora_check_out: new Date('2024-10-10T01:48:02.000Z'),
                } as CheckInsModel,
            ],
            dt_criacao: new Date('2024-10-10T01:48:02.000Z'),
            dt_ult_atualizacao: new Date('2024-10-10T01:48:02.000Z'),
        } as unknown as ConvidadoEvento
    },

    criarConvidado2: () => {
        return {
            email: 'convidado2@email.com',
            id_evento: '01J9SQF9YP9RYVMB61RCAS2BS1',
            check_ins: [
                {
                    id: '01J9SQF9YP9RYVMB61RCAS2BS1',
                    dt_hora_check_in: new Date('2024-10-10T01:48:02.000Z'),
                } as CheckInsModel,
            ],
            dt_criacao: new Date('2024-10-10T01:48:02.000Z'),
            dt_ult_atualizacao: new Date('2024-10-10T01:48:02.000Z'),
        } as unknown as ConvidadoEvento
    },
}
