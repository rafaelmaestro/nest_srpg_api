import { EventoModel } from '../evento.model'
import { mockConvidadoModel } from './convidado-evento.model'

export const mockEventoModel = {
    criarEvento1: () => {
        return {
            nome: 'Evento 1',
            descricao: 'Descrição do evento 1',
            dt_inicio_prevista: new Date('2024-12-17T02:39:00.000Z'),
            dt_fim_prevista: new Date('2024-12-19T02:39:00.000Z'),
            minutos_tolerancia: 10,
            id: '01J9SQF9YP9RYVMB61RCAS2BS1',
            distancia_maxima_permitida: 100,
            cpf_organizador: '123456789',
            local: 'Local do evento 1',
            convidados: [mockConvidadoModel.criarConvidado1(), mockConvidadoModel.criarConvidado2()],
            latitude: 11111112,
            longitude: 2222222,
            status: 'PENDENTE',
            dt_criacao: new Date('2024-10-10T01:48:02.000Z'),
            dt_ult_atualizacao: new Date('2024-10-10T01:48:02.000Z'),
        } as unknown as EventoModel
    },
}

// {
//     nome: "teste pelo backend",
//     descricao: "teste",
//     dt_inicio_prevista: "2024-12-17T02:39:00.000",
//     dt_fim_prevista: "2024-12-19T02:39:00.000",
//     distancia_maxima_permitida: 20,
//     minutos_tolerancia: 15,
//     local: "teste",
//     cpf_organizador: "52776789808",
//     convidados: [
//       {
//         email: "tadeudasilva@live.com.br",
//         id_evento: "01J9SQF9YP9RYVMB61RCAS2BS1",
//         check_ins: [

//         ],
//         dt_criacao: "2024-10-10T01:48:02.000Z",
//         dt_ult_atualizacao: "2024-10-10T01:48:02.000Z",

//       },

//     ],
//     status: "PENDENTE",
//     dt_inicio: undefined,
//     dt_fim: undefined,
//     id: "01J9SQF9YP9RYVMB61RCAS2BS1",
//     dt_criacao: "2024-10-10T01:48:02.000Z",
//     dt_ult_atualizacao: "2024-10-10T01:48:02.000Z",

//   }
