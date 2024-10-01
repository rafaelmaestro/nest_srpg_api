import { forwardRef, Module } from '@nestjs/common'
import { UsuarioModule } from '../usuario/usuario.module'
import { EventoController } from './evento.controller'
import { EventoRepository } from './evento.repository'
import { EventoService } from './evento.service'
import { EMailerService } from '../mailer/mailer.service'

@Module({
    controllers: [EventoController],
    providers: [EventoService, EventoRepository, EMailerService],
    imports: [forwardRef(() => UsuarioModule)],
})
export class EventoModule {}
