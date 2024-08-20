import { Injectable, NotFoundException } from '@nestjs/common'
import { UsuarioService } from '../usuario/usuario.service'
import { CreateEventoDto } from './dto/create-evento.dto'
import { EventoRepository } from './evento.repository'

@Injectable()
export class EventoService {
    constructor(
        private readonly eventoRepository: EventoRepository,
        private readonly usuarioService: UsuarioService,
    ) {}
    async create(createEventoDto: CreateEventoDto) {
        const usuario = await this.usuarioService.findByCpf(createEventoDto.cpf_organizador)

        if (!usuario) {
            throw new NotFoundException(
                `Usuário não encontrado com o CPF informado: ${createEventoDto.cpf_organizador}`,
            )
        }
        const eventoCriado = await this.eventoRepository.save(createEventoDto)

        if (eventoCriado) {
            // TODO: Implementar envio de e-mail para os convidados
        }

        return eventoCriado
    }
}
