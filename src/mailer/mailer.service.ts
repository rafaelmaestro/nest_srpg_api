import { MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'
import { SendMailEventoAtualizado } from './interfaces/SendMailEventoAtualizado'
import { SendMailConvidado } from './interfaces/SendMailConvidado'
import { SendMailRelatorioEventoGerado } from './interfaces/SendMailRelatorioEventoGerado'

@Injectable()
export class EMailerService {
    constructor(private readonly mailerService: MailerService) {}
    sendMail(destinatario: string, assunto: string, corpo: string, html: string, attachments?: any) {
        if (
            (process.env.APP_ENV && process.env.APP_ENV.toLocaleUpperCase() == 'DEV') ||
            process.env.APP_ENV.toLocaleUpperCase() == 'TEST'
        ) {
            destinatario = process.env.EMAIL_TEST
        }
        this.mailerService.sendMail({
            to: destinatario,
            from: process.env.EMAIL_USER,
            subject: assunto,
            text: corpo,
            html: html,
            attachments: attachments,
        })
    }

    sendMailConvidado(props: SendMailConvidado) {
        const { nomeEvento, localEvento, dataEvento, descricaoEvento, nomeOrganizador, emailsDestinatarios } = props

        const assunto = `Convite para o evento ${nomeEvento}!`

        const html = `<html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Temos um convite para você! - SRPG</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                }
                .email-container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #3498db;
                    font-size: 24px;
                    text-align: center;
                }
                p {
                    line-height: 1.6;
                }
                .highlight {
                    color: #2980b9;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #888;
                }
                .footer a {
                    color: #3498db;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <h1>Você foi convidado para o Evento <span class="highlight">${nomeEvento}</span></h1>
                <p>Olá,</p>
                <p>Você foi convidado para o evento <strong>${nomeEvento}</strong>, organizado por <strong>${nomeOrganizador}</strong>.</p>
                <p>O evento ocorrerá em <strong>${dataEvento.toLocaleDateString('pt-BR')} às ${dataEvento.toLocaleTimeString('pt-BR')}</strong> no local <strong>${localEvento}</strong>.</p>
                <p><strong>Descrição do evento:</strong> ${descricaoEvento}</p>
                <p>Acesse o app do <strong>SRPG</strong> para mais informações e confirmar sua participação!</p>
                <div class="footer">
                    <p>Este é um email automático enviado pelo sistema <strong>SRPG</strong>. Por favor, não responda a este email.</p>
                    <p><a href="https://srpg.app">Visite nosso site</a></p>
                </div>
            </div>
        </body>
        </html>`

        emailsDestinatarios.forEach((email) => {
            this.sendMail(email, assunto, null, html)
        })
    }

    async sendMailEventoAtualizado(props: SendMailEventoAtualizado) {
        const { statusEvento, localEvento, nomeEvento, dataAtualizacao, emailsNotificados, tempoPermanencia } = props

        if (statusEvento == 'INICIADO') {
            this._sendMailEventoIniciado(localEvento, nomeEvento, dataAtualizacao, emailsNotificados)
        }

        if (statusEvento == 'FINALIZADO') {
            this._sendMailEventoFinalizado(
                localEvento,
                nomeEvento,
                dataAtualizacao,
                tempoPermanencia,
                emailsNotificados,
            )
        }

        if (statusEvento == 'CANCELADO') {
            this._sendMailEventoCancelado(nomeEvento, emailsNotificados)
        }

        if (statusEvento == 'PAUSADO') {
            this._sendMailEventoPausado(nomeEvento, dataAtualizacao, emailsNotificados)
        }

        if (statusEvento == 'RETOMADO') {
            this._sendMailEventoRetomado(nomeEvento, dataAtualizacao, emailsNotificados)
        }
    }

    private _sendMailEventoIniciado(
        localEvento: string,
        nomeEvento: string,
        dataAtualizacao: Date,
        emailsNotificados: string[],
    ) {
        const assunto = `Evento ${nomeEvento} está EM ANDAMENTO!`
        const html = `<!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Evento em Andamento - SRPG</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                }
                .email-container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #2980b9;
                    font-size: 24px;
                    text-align: center;
                }
                p {
                    line-height: 1.6;
                }
                .highlight {
                    color: #27ae60;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #888;
                }
                .footer a {
                    color: #3498db;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <h1>Evento <span class="highlight">${nomeEvento}</span> em Andamento</h1>
                <p>Olá,</p>
                <p>O evento <strong>${nomeEvento}</strong> foi iniciado no local <strong>${localEvento}</strong> em <strong>${dataAtualizacao.toLocaleDateString('pt-BR')} às ${dataAtualizacao.toLocaleTimeString('pt-BR')}</strong>.</p>
                <p>Para mais informações e detalhes sobre o evento, acesse o app do <strong>SRPG</strong>.</p>
                <p>Aproveite o evento!</p>
                <div class="footer">
                    <p>Este é um email automático enviado pelo sistema <strong>SRPG</strong>. Por favor, não responda a este email.</p>
                    <p><a href="https://srpg.app">Visite nosso site</a></p>
                </div>
            </div>
        </body>
        </html>
        `

        emailsNotificados.forEach((email) => {
            this.sendMail(email, assunto, null, html)
        })
    }

    private _sendMailEventoFinalizado(
        localEvento: string,
        nomeEvento: string,
        dataAtualizacao: Date,
        tempoPermanencia: number,
        emailsNotificados: string[],
    ) {
        const assunto = `Evento ${nomeEvento} foi FINALIZADO!`
        const html = `<html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Evento Finalizado - SRPG</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                }
                .email-container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #2c3e50;
                    font-size: 24px;
                    text-align: center;
                }
                p {
                    line-height: 1.6;
                }
                .highlight {
                    color: #e74c3c;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #888;
                }
                .footer a {
                    color: #3498db;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <h1>Evento <span class="highlight">${nomeEvento}</span> Finalizado</h1>
                <p>Olá,</p>
                <p>O evento <strong>${nomeEvento}</strong> realizado no local <strong>${localEvento}</strong> foi finalizado em <strong>${dataAtualizacao.toLocaleDateString('pt-BR')} às ${dataAtualizacao.toLocaleTimeString('pt-BR')}</strong>.</p>
                <p>Você permaneceu no evento por <strong>${tempoPermanencia}</strong> minutos.</p>
                <p>Agradecemos sua participação!</p>
                <div class="footer">
                    <p>Este é um email automático enviado pelo sistema <strong>SRPG</strong>. Por favor, não responda a este email.</p>
                    <p><a href="https://srpg.app">Visite nosso site</a></p>
                </div>
            </div>
        </body>
        </html>`

        emailsNotificados.forEach((email) => {
            this.sendMail(email, assunto, null, html)
        })
    }

    private _sendMailEventoCancelado(nomeEvento: string, emailsNotificados: string[]) {
        const assunto = `Evento ${nomeEvento} foi CANCELADO!`
        const html = `<html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Evento Cancelado - SRPG</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                }
                .email-container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #c0392b;
                    font-size: 24px;
                    text-align: center;
                }
                p {
                    line-height: 1.6;
                }
                .highlight {
                    color: #e74c3c;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #888;
                }
                .footer a {
                    color: #3498db;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <h1>Evento <span class="highlight">${nomeEvento}</span> Cancelado</h1>
                <p>Olá,</p>
                <p>Infelizmente, o evento <strong>${nomeEvento}</strong> foi <strong>cancelado</strong>.</p>
                <p>Este evento não estará mais disponível no app do <strong>SRPG</strong>.</p>
                <p>Lamentamos qualquer inconveniente.</p>
                <div class="footer">
                    <p>Este é um email automático enviado pelo sistema <strong>SRPG</strong>. Por favor, não responda a este email.</p>
                    <p><a href="https://srpg.app">Visite nosso site</a></p>
                </div>
            </div>
        </body>
        </html>`

        emailsNotificados.forEach((email) => {
            this.sendMail(email, assunto, null, html)
        })
    }

    private _sendMailEventoPausado(nomeEvento: string, dataAtualizacao: Date, emailsNotificados: string[]) {
        const assunto = `Evento ${nomeEvento} foi PAUSADO!`
        const html = `<html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Evento Pausado - SRPG</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                }
                .email-container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #f39c12;
                    font-size: 24px;
                    text-align: center;
                }
                p {
                    line-height: 1.6;
                }
                .highlight {
                    color: #e67e22;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #888;
                }
                .footer a {
                    color: #3498db;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <h1>Evento <span class="highlight">${nomeEvento}</span> Pausado</h1>
                <p>Olá,</p>
                <p>O evento <strong>${nomeEvento}</strong> foi <strong>pausado</strong> em <strong>${dataAtualizacao.toLocaleDateString('pt-BR')} às ${dataAtualizacao.toLocaleTimeString('pt-BR')}</strong>.</p>
                <p>Enquanto o evento estiver pausado, você não poderá se distanciar do local do evento. Quando o evento for retomado, você será notificado.</p>
                <p>Fique atento(a) para mais atualizações!</p>
                <div class="footer">
                    <p>Este é um email automático enviado pelo sistema <strong>SRPG</strong>. Por favor, não responda a este email.</p>
                    <p><a href="https://srpg.app">Visite nosso site</a></p>
                </div>
            </div>
        </body>
        </html>`

        emailsNotificados.forEach((email) => {
            this.sendMail(email, assunto, null, html)
        })
    }

    private _sendMailEventoRetomado(nomeEvento: string, dataAtualizacao: Date, emailsNotificados: string[]) {
        const assunto = `Evento ${nomeEvento} foi RETOMADO!`
        const html = `<html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Evento Retomado - SRPG</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    margin: 0;
                    padding: 20px;
                }
                .email-container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #27ae60;
                    font-size: 24px;
                    text-align: center;
                }
                p {
                    line-height: 1.6;
                }
                .highlight {
                    color: #2ecc71;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #888;
                }
                .footer a {
                    color: #3498db;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <h1>Evento <span class="highlight">${nomeEvento}</span> Retomado</h1>
                <p>Olá,</p>
                <p>O evento <strong>${nomeEvento}</strong> foi <strong>retomado</strong> em <strong>${dataAtualizacao.toLocaleDateString('pt-BR')} às ${dataAtualizacao.toLocaleTimeString('pt-BR')}</strong>.</p>
                <p>Você deve retornar ao local do evento para continuar participando. Fique atento(a) às próximas instruções no app do <strong>SRPG</strong>.</p>
                <p>Esperamos que tudo corra bem daqui para frente!</p>
                <div class="footer">
                    <p>Este é um email automático enviado pelo sistema <strong>SRPG</strong>. Por favor, não responda a este email.</p>
                    <p><a href="https://srpg.app">Visite nosso site</a></p>
                </div>
            </div>
        </body>
        </html>`

        emailsNotificados.forEach((email) => {
            this.sendMail(email, assunto, null, html)
        })
    }

    async sendMailRelatorioEventoGerado(props: SendMailRelatorioEventoGerado) {
        const dataGeracao = new Date()
        const assunto = `Relatório do Evento "${props.nomeEvento}" Gerado!`
        const html = `
                            <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Relatório do Evento Gerado - SRPG</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            color: #333;
                            margin: 0;
                            padding: 20px;
                        }
                        .email-container {
                            background-color: #ffffff;
                            border-radius: 10px;
                            max-width: 600px;
                            margin: auto;
                            padding: 20px;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #e67e22;
                            font-size: 24px;
                            text-align: center;
                        }
                        p {
                            line-height: 1.6;
                        }
                        .highlight {
                            color: #d35400;
                            font-weight: bold;
                        }
                        .footer {
                            margin-top: 30px;
                            text-align: center;
                            font-size: 12px;
                            color: #888;
                        }
                        .footer a {
                            color: #3498db;
                            text-decoration: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <h1>Relatório Gerado para o Evento <span class="highlight">${props.nomeEvento}</span></h1>
                        <p>Olá,</p>
                        <p>O relatório para o evento <strong>${props.nomeEvento}</strong>, realizado em <strong>${props.dataEvento.toLocaleDateString('pt-BR')}</strong>, foi gerado com sucesso e está disponível em anexo.</p>
                        <p>Para mais informações sobre o evento, acesse o app do <strong>SRPG</strong>.</p>
                        <p>Data de geração do relatório: <strong>${dataGeracao.toLocaleDateString('pt-BR')} às ${dataGeracao.toLocaleTimeString('pt-BR')}</strong>.</p>
                        <div class="footer">
                            <p>Este é um email automático enviado pelo sistema <strong>SRPG</strong>. Por favor, não responda a este email.</p>
                            <p><a href="https://srpg.app">Visite nosso site</a></p>
                        </div>
                    </div>
                </body>
                </html>
        `

        const attachments = [
            {
                filename: props.fileName,
                content: props.file,
                encondig: 'base64',
            },
        ]

        this.sendMail(props.emailOrganizador, assunto, null, html, attachments)
        return true
    }
}
