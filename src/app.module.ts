import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsuarioModule } from './usuario/usuario.module';

@Module({
  imports: [AuthModule, UsuarioModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
