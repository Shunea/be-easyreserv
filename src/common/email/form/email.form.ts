import * as Mail from 'nodemailer/lib/mailer';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { ERROR_MESSAGES } from '@src/constants';

@Injectable()
export class EmailService {
  private nodemailerTransport: Mail;
  private logger: Logger;

  constructor() {
    this.logger = new Logger(EmailService.name);
    this.nodemailerTransport = createTransport({
      host: process.env.MAIL_HOST,
      port: +process.env.MAIL_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });
  }

  async sendMail(options: Mail.Options) {
    try {
      const info = await this.nodemailerTransport.sendMail(options);
      this.logger.log(`Email sent successfully: ${info.response}`);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
