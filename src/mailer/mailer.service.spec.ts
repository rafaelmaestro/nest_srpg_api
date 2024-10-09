import { MailerService } from '@nestjs-modules/mailer'
import { Test, TestingModule } from '@nestjs/testing'
import { setEnv } from '../../config'
import { EMailerService } from './mailer.service'

setEnv()

describe(`${EMailerService.name} suite`, () => {
    let service: EMailerService
    let mailerService: MailerService

    // Mock do MailerService
    const mockMailerService = {
        sendMail: jest.fn().mockResolvedValue(true), // Aqui você pode ajustar o comportamento do mock
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EMailerService,
                {
                    provide: MailerService,
                    useValue: mockMailerService, // Injeta o mock aqui
                },
            ],
        }).compile()

        service = module.get<EMailerService>(EMailerService)
        mailerService = module.get<MailerService>(MailerService)
    })

    it('deve estar definido', () => {
        expect(service).toBeDefined()
    })

    describe(`${EMailerService.prototype.sendMail.name} suite`, () => {
        it(`deve tentar enviar um email para o destinário cadastrado nas envs caso o app env seja DEV ou TEST`, async () => {
            jest.spyOn(mailerService, 'sendMail').mockResolvedValue(true)

            service.sendMail(
                'teste1@gmail.com',
                'Teste de envio de email',
                'Teste de envio de email',
                'Teste de envio de email',
            )

            expect(mailerService.sendMail).toHaveBeenCalled()

            expect(mailerService.sendMail).toHaveBeenCalledWith({
                to: process.env.EMAIL_TEST,
                from: process.env.EMAIL_USER,
                subject: 'Teste de envio de email',
                text: 'Teste de envio de email',
                html: 'Teste de envio de email',
                attachments: undefined,
            })
        })

        it(`deve tentar enviar um email para o usuário enviado nos parâmetros caso o app env não seja DEV ou TEST`, async () => {
            jest.spyOn(mailerService, 'sendMail').mockResolvedValue(true)

            const originalEnv = process.env.APP_ENV

            process.env.APP_ENV = 'PRD'

            service.sendMail(
                'teste1@gmail.com',
                'Teste de envio de email',
                'Teste de envio de email',
                'Teste de envio de email',
            )

            process.env.APP_ENV = originalEnv

            expect(mailerService.sendMail).toHaveBeenCalled()

            expect(mailerService.sendMail).toHaveBeenCalledWith({
                to: process.env.EMAIL_TEST,
                from: process.env.EMAIL_USER,
                subject: 'Teste de envio de email',
                text: 'Teste de envio de email',
                html: 'Teste de envio de email',
                attachments: undefined,
            })
        })
    })

    describe(`${EMailerService.prototype.sendMailConvidado.name} suite`, () => {
        it(`deve retornar uma string de erro caso não seja enviado o nome do evento`, async () => {
            const result = service.sendMailConvidado({
                nomeEvento: null,
                dataEvento: new Date(),
                descricaoEvento: 'Teste de envio de email',
                emailsDestinatarios: ['teste@email.com'],
                localEvento: 'Teste de envio de email',
                nomeOrganizador: 'Teste de envio de email',
            })

            expect(result).toEqual('Nome do evento é obrigatório')
        })

        it(`deve retornar uma string de erro caso não seja enviado a data do evento`, async () => {
            const result = service.sendMailConvidado({
                nomeEvento: 'Teste de envio de email',
                dataEvento: null,
                descricaoEvento: 'Teste de envio de email',
                emailsDestinatarios: ['teste@email.com'],
                localEvento: 'Teste de envio de email',
                nomeOrganizador: 'Teste de envio de email',
            })

            expect(result).toEqual('Data do evento é obrigatória')
        })

        it(`deve retornar uma string de erro caso não seja enviado a descrição do evento`, async () => {
            const result = service.sendMailConvidado({
                nomeEvento: 'Teste de envio de email',
                dataEvento: new Date(),
                descricaoEvento: null,
                emailsDestinatarios: ['teste@email.com'],
                localEvento: 'Teste de envio de email',
                nomeOrganizador: 'Teste de envio de email',
            })

            expect(result).toEqual('Descrição do evento é obrigatória')
        })

        it(`deve retornar uma string de erro caso não seja enviado o email do destinatário`, async () => {
            const result = service.sendMailConvidado({
                nomeEvento: 'Teste de envio de email',
                dataEvento: new Date(),
                descricaoEvento: 'Teste de envio de email',
                emailsDestinatarios: null,
                localEvento: 'Teste de envio de email',
                nomeOrganizador: 'Teste de envio de email',
            })

            expect(result).toEqual('Pelo menos um email de destinatário é obrigatório')
        })

        it(`deve retornar uma string de erro caso não seja enviado o local do evento`, async () => {
            const result = service.sendMailConvidado({
                nomeEvento: 'Teste de envio de email',
                dataEvento: new Date(),
                descricaoEvento: 'Teste de envio de email',
                emailsDestinatarios: ['teste@email.com'],
                localEvento: null,
                nomeOrganizador: 'Teste de envio de email',
            })

            expect(result).toEqual('Local do evento é obrigatório')
        })

        it(`deve retornar uma string de erro caso não seja enviado o nome do organizador`, async () => {
            const result = service.sendMailConvidado({
                nomeEvento: 'Teste de envio de email',
                dataEvento: new Date(),
                descricaoEvento: 'Teste de envio de email',
                emailsDestinatarios: ['teste@email.com'],
                localEvento: 'Teste de envio de email',
                nomeOrganizador: null,
            })

            expect(result).toEqual('Nome do organizador é obrigatório')
        })

        it(`deve tentar enviar um email para os destinatários com as informações do evento`, async () => {
            jest.spyOn(mailerService, 'sendMail').mockResolvedValue(true)

            const result = service.sendMailConvidado({
                nomeEvento: 'Teste de envio de email',
                dataEvento: new Date(),
                descricaoEvento: 'Teste de envio de email',
                emailsDestinatarios: ['teste@email.com'],
                localEvento: 'Teste de envio de email',
                nomeOrganizador: 'Teste de envio de email',
            })

            expect(result).toBe(undefined)
            expect(mailerService.sendMail).toHaveBeenCalled()
        })
    })

    describe(`${EMailerService.prototype.sendMailEventoAtualizado.name} suite`, () => {
        it(`deve retornar uma string de erro caso não seja enviado o nome do evento`, async () => {
            const result = service.sendMailEventoAtualizado({
                tempoPermanencia: 10,
                dataAtualizacao: new Date(),
                localEvento: 'Teste de envio de email',
                emailsNotificados: ['teste@email.com'],
                statusEvento: 'Teste de envio de email',
                nomeEvento: null,
            })

            expect(result).toEqual('Nome do evento é obrigatório')
        })

        it(`deve retornar uma string de erro caso não seja enviado o tempo de permanência`, async () => {
            const result = service.sendMailEventoAtualizado({
                tempoPermanencia: null,
                dataAtualizacao: new Date(),
                localEvento: 'Teste de envio de email',
                emailsNotificados: ['teste@email.com'],
                statusEvento: 'Teste de envio de email',
                nomeEvento: 'Teste de envio de email',
            })

            expect(result).toEqual('Tempo de permanência no evento é obrigatório')
        })

        it(`deve retornar uma string de erro caso não seja enviado a data de atualização`, async () => {
            const result = service.sendMailEventoAtualizado({
                tempoPermanencia: 10,
                dataAtualizacao: null,
                localEvento: 'Teste de envio de email',
                emailsNotificados: ['teste@email.com'],
                statusEvento: 'Teste de envio de email',
                nomeEvento: 'Teste de envio de email',
            })

            expect(result).toEqual('Data de atualização do evento é obrigatória')
        })

        it(`deve retornar uma string de erro caso não seja enviado o local do evento`, async () => {
            const result = service.sendMailEventoAtualizado({
                tempoPermanencia: 10,
                dataAtualizacao: new Date(),
                localEvento: null,
                emailsNotificados: ['teste@email.com'],
                statusEvento: 'Teste de envio de email',
                nomeEvento: 'Teste de envio de email',
            })

            expect(result).toEqual('Local do evento é obrigatório')
        })

        it(`deve retornar uma string de erro caso não seja enviado o email dos notificados`, async () => {
            const result = service.sendMailEventoAtualizado({
                tempoPermanencia: 10,
                dataAtualizacao: new Date(),
                localEvento: 'Teste de envio de email',
                emailsNotificados: null,
                statusEvento: 'Teste de envio de email',
                nomeEvento: 'Teste de envio de email',
            })

            expect(result).toEqual('Pelo menos um email de destinatário é obrigatório')
        })

        it(`deve retornar uma string de erro caso não seja enviado o status do evento`, async () => {
            const result = service.sendMailEventoAtualizado({
                tempoPermanencia: 10,
                dataAtualizacao: new Date(),
                localEvento: 'Teste de envio de email',
                emailsNotificados: ['teste@email.com'],
                statusEvento: null,
                nomeEvento: 'Teste de envio de email',
            })

            expect(result).toEqual('Status do evento é obrigatório')
        })

        it(`deve tentar enviar um email de evento INICIADO para os emails notificados`, async () => {
            jest.spyOn(mailerService, 'sendMail').mockResolvedValue(true)

            const sendMailEventoIniciadoSpy = jest.spyOn(service as any, '_sendMailEventoIniciado')

            const result = service.sendMailEventoAtualizado({
                tempoPermanencia: 10,
                dataAtualizacao: new Date(),
                localEvento: 'Teste de envio de email',
                emailsNotificados: ['teste@email.com'],
                statusEvento: 'INICIADO',
                nomeEvento: 'Teste de envio de email',
            })

            expect(result).toBe(undefined)
            expect(mailerService.sendMail).toHaveBeenCalled()
            expect(sendMailEventoIniciadoSpy).toHaveBeenCalled()
        })

        it(`deve tentar enviar um email de evento FINALIZADO para os emails notificados`, async () => {
            jest.spyOn(mailerService, 'sendMail').mockResolvedValue(true)

            const sendMailEventoFinalizadoSpy = jest.spyOn(service as any, '_sendMailEventoFinalizado')

            const result = service.sendMailEventoAtualizado({
                tempoPermanencia: 10,
                dataAtualizacao: new Date(),
                localEvento: 'Teste de envio de email',
                emailsNotificados: ['teste@email.com'],
                statusEvento: 'FINALIZADO',
                nomeEvento: 'Teste de envio de email',
            })

            expect(result).toBe(undefined)
            expect(mailerService.sendMail).toHaveBeenCalled()
            expect(sendMailEventoFinalizadoSpy).toHaveBeenCalled()
        })

        it(`deve tentar enviar um email de evento CANCELADO para os emails notificados`, async () => {
            jest.spyOn(mailerService, 'sendMail').mockResolvedValue(true)

            const sendMailEventoCanceladoSpy = jest.spyOn(service as any, '_sendMailEventoCancelado')

            const result = service.sendMailEventoAtualizado({
                tempoPermanencia: 10,
                dataAtualizacao: new Date(),
                localEvento: 'Teste de envio de email',
                emailsNotificados: ['teste@email.com'],
                statusEvento: 'CANCELADO',
                nomeEvento: 'Teste de envio de email',
            })

            expect(result).toBe(undefined)
            expect(mailerService.sendMail).toHaveBeenCalled()
            expect(sendMailEventoCanceladoSpy).toHaveBeenCalled()
        })

        it(`deve tentar enviar um email de evento PAUSADO para os emails notificados`, async () => {
            jest.spyOn(mailerService, 'sendMail').mockResolvedValue(true)

            const sendMailEventoPausadoSpy = jest.spyOn(service as any, '_sendMailEventoPausado')

            const result = service.sendMailEventoAtualizado({
                tempoPermanencia: 10,
                dataAtualizacao: new Date(),
                localEvento: 'Teste de envio de email',
                emailsNotificados: ['teste@email.com'],
                statusEvento: 'PAUSADO',
                nomeEvento: 'Teste de envio de email',
            })

            expect(result).toBe(undefined)
            expect(mailerService.sendMail).toHaveBeenCalled()
            expect(sendMailEventoPausadoSpy).toHaveBeenCalled()
        })

        it(`deve tentar enviar um email de evento RETOMADO para os emails notificados`, async () => {
            jest.spyOn(mailerService, 'sendMail').mockResolvedValue(true)

            const sendMailEventoRetomadoSpy = jest.spyOn(service as any, '_sendMailEventoRetomado')

            const result = service.sendMailEventoAtualizado({
                tempoPermanencia: 10,
                dataAtualizacao: new Date(),
                localEvento: 'Teste de envio de email',
                emailsNotificados: ['teste@email.com'],
                statusEvento: 'RETOMADO',
                nomeEvento: 'Teste de envio de email',
            })

            expect(result).toBe(undefined)
            expect(mailerService.sendMail).toHaveBeenCalled()
            expect(sendMailEventoRetomadoSpy).toHaveBeenCalled()
        })
    })

    describe(`${EMailerService.prototype.sendMailRelatorioEventoGerado.name} suite`, () => {
        it(`deve retornar uma string de erro caso não seja enviado o nome do evento`, async () => {
            const result = service.sendMailRelatorioEventoGerado({
                dataEvento: new Date(),
                emailOrganizador: 'email@teste.com',
                file: 'Teste de envio de email',
                nomeEvento: null,
                fileName: 'Teste de envio de email',
            })

            expect(result).toEqual('Nome do evento é obrigatório')
        })

        it(`deve retornar uma string de erro caso não seja enviado a data do evento`, async () => {
            const result = service.sendMailRelatorioEventoGerado({
                dataEvento: null,
                emailOrganizador: 'email@teste.com',
                file: 'Teste de envio de email',
                nomeEvento: 'Teste de envio de email',
                fileName: 'Teste de envio de email',
            })

            expect(result).toEqual('Data do evento é obrigatória')
        })

        it(`deve retornar uma string de erro caso não seja enviado o email do organizador`, async () => {
            const result = service.sendMailRelatorioEventoGerado({
                dataEvento: new Date(),
                emailOrganizador: null,
                file: 'Teste de envio de email',
                nomeEvento: 'Teste de envio de email',
                fileName: 'Teste de envio de email',
            })

            expect(result).toEqual('Email do organizador é obrigatório')
        })

        it(`deve retornar uma string de erro caso não seja enviado o arquivo`, async () => {
            const result = service.sendMailRelatorioEventoGerado({
                dataEvento: new Date(),
                emailOrganizador: 'email@teste.com',
                file: null,
                nomeEvento: 'Teste de envio de email',
                fileName: 'Teste de envio de email',
            })

            expect(result).toEqual('Arquivo do relatório é obrigatório')
        })

        it(`deve retornar uma string de erro caso não seja enviado o nome do arquivo`, async () => {
            const result = service.sendMailRelatorioEventoGerado({
                dataEvento: new Date(),
                emailOrganizador: 'email@teste.com',
                file: 'Teste de envio de email',
                nomeEvento: 'Teste de envio de email',
                fileName: null,
            })

            expect(result).toEqual('Nome do arquivo do relatório é obrigatório')
        })

        it(`deve tentar enviar um email com o relatório do evento para o organizador e retornar true`, async () => {
            jest.spyOn(mailerService, 'sendMail').mockResolvedValue(true)

            const result = service.sendMailRelatorioEventoGerado({
                dataEvento: new Date(),
                emailOrganizador: 'email@teste.com',
                file: 'Teste de envio de email',
                nomeEvento: 'Teste de envio de email',
                fileName: 'Teste de envio de email',
            })

            expect(result).toBe(true)
            expect(mailerService.sendMail).toHaveBeenCalled()
        })
    })
})
