import { Context, Telegraf } from 'telegraf';
import { InjectBot, Start, Update } from 'nestjs-telegraf';
import { InjectRepository } from '@nestjs/typeorm';
import { Suplier } from '@src/suplier/entities/suplier.entity';
import { Repository } from 'typeorm';
import { SentenceBuilder } from './common.sentences';

export class TelegramCommunicationService {
  constructor(
    @InjectRepository(Suplier)
    private readonly suplierRepository: Repository<Suplier>,
    @InjectBot() private bot: Telegraf<Context>,
  ) {
    this.bot.start(async (ctx) => {
      const suplier = await this.suplierRepository
        .createQueryBuilder('suplier')
        .where('suplier.telegram_username = :username', {
          username: ctx.from.username,
        })
        .getOne();
      if (suplier) {
        suplier.telegramId = ctx.from.id.toString();
        await this.suplierRepository.save(suplier);
      }
      await ctx.reply(SentenceBuilder.buildHelloSentence(ctx.from.first_name));
    });
  }
}
