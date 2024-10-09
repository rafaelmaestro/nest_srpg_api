import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { Usuario } from './usuario/entities/usuario.entity'

describe('AppController', () => {
    let appController: AppController

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
        }).compile()

        appController = app.get<AppController>(AppController)
    })

    describe('root', () => {
        it('should return "Hello World!"', () => {
            expect(appController.getHello()).toStrictEqual({
                Date: expect.any(Date),
                Message: 'Hello, world!',
            })
        })
    })

    describe('me', () => {
        it('should return the current user', () => {
            const usuario = {
                cpf: '12345678901',
                nome: 'Fulano de Tal',
                email: 'email@emqail.com',
            }
            expect(appController.getMe(usuario as unknown as Usuario)).toStrictEqual(usuario)
        })
    })
})
