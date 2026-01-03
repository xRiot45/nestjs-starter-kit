import { Injectable } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import * as hbs from 'nodemailer-express-handlebars';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { join } from 'path';

interface MailOptions {
    to: string;
    subject: string;
    template: string;
    context: Record<string, unknown>;
}

@Injectable()
export class MailService {
    private readonly transporter: Transporter<SMTPTransport.SentMessageInfo>;

    constructor() {
        const transportOptions: SMTPTransport.Options = {
            host: process.env.MAIL_HOST ?? 'localhost',
            port: Number(process.env.MAIL_PORT ?? 1025),
            ignoreTLS: true,
        };

        this.transporter = nodemailer.createTransport(transportOptions);

        // Konfigurasi Handlebars
        this.transporter.use(
            'compile',
            hbs.default({
                viewEngine: {
                    extname: '.hbs',
                    layoutsDir: join(__dirname, '..', 'templates', 'layouts'),
                    defaultLayout: 'main',
                    partialsDir: join(__dirname, '..', 'templates', 'partials'),
                },
                viewPath: join(__dirname, '..', 'templates'),
                extName: '.hbs',
            }),
        );
    }

    async sendMail(options: MailOptions): Promise<void> {
        const { to, subject, template, context } = options;

        const mailOptions: nodemailer.SendMailOptions & {
            template?: string;
            context?: Record<string, unknown>;
        } = {
            from: process.env.MAIL_FROM ?? '"No Reply" <noreply@example.com>',
            to,
            subject,
            template,
            context,
        };

        await this.transporter.sendMail(mailOptions);
    }
}
