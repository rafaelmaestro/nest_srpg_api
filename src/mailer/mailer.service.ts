import { MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'

@Injectable()
export class EMailerService {
    constructor(private readonly mailerService: MailerService) {}
    async sendMail(destinatario: string, assunto: string, corpo: string, html: string) {
        await this.mailerService.sendMail({
            to: destinatario,
            from: process.env.EMAIL_USER,
            subject: assunto,
            text: corpo,
            html: html,
        })
    }
}
