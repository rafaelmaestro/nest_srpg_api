import { CreateEventoDto } from '../dto/create-evento.dto'

export const mockEvento = {
    criarEvento1: () => {
        return {
            nome: 'Evento 1',
            descricao: 'Descrição do evento 1',
            local: 'Local do evento 1',
            convidados: ['convidado1@email.com', 'convidado2@email.com'],
            latitude: 0,
            longitude: 0,
            cpf_organizador: '123456789',
            dt_inicio_prevista: new Date(),
            dt_fim_prevista: new Date(),
            minutos_tolerancia: 10,
            status: 'PENDENTE',
            distancia_maxima_permitida: 100,
        } as unknown as CreateEventoDto
    },
}
