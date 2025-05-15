import { Module } from '@nestjs/common';
import { TelegramCommunicationService } from './telegram.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Suplier } from '@src/suplier/entities/suplier.entity';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';

@Module({
  imports: [
    TypeOrmModule.forFeature([Suplier]),
    TelegrafModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_TOKEN'),
        botName: process.env.BOT_NAME,
        launchOptions: {
          webhook: {
            domain: process.env.DOMAIN_URL,
            hookPath: process.env.HOOK_PATH,
            port: +process.env.TELEGRAM_PORT,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [TelegramCommunicationService],
  controllers: [],
  providers: [TelegramCommunicationService],
})
export class TelegramConnectionModule {}
