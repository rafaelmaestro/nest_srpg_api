import { forwardRef, Module } from '@nestjs/common'
import { UsuarioModule } from '../usuario/usuario.module'
import { EventoController } from './evento.controller'
import { EventoRepository } from './evento.repository'
import { EventoService } from './evento.service'

@Module({
    controllers: [EventoController],
    providers: [EventoService, EventoRepository],
    imports: [forwardRef(() => UsuarioModule)],
})
export class EventoModule {}
