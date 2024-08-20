import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OrmModuleOptions } from '../ormconfig'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { EventoModule } from './evento/evento.module'
import { UsuarioModule } from './usuario/usuario.module'

@Module({
    imports: [TypeOrmModule?.forRoot({ ...OrmModuleOptions }), AuthModule, UsuarioModule, EventoModule],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule {}
