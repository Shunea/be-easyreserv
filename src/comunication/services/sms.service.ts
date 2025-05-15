import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private alias = 'sms';

  constructor(private httpService: HttpService,
              private readonly configService: ConfigService,
  ) {
  }

  sendSms(senderAlias: string, receiverNumber: string, message: string) {
    const API_KEY = this.configService.get<string>('SMS_API_KEY');
    const base_url = `https://api.sms.md/v1/send`;

    let url: string;

    try {
      url = `${base_url}?from=${senderAlias}&to=${receiverNumber}&message=${message}&token=${API_KEY}`;
      console.log(url);

      return this.httpService.get(url).pipe(
        map((response) => response),
      );

    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}