import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { COMMUNICATION_QUEUE } from './queues/constants';
import { ExpressAdapter } from '@bull-board/express';
import { GlobalExceptionFilter } from './middlewares/GlobalExceptionFilter';
import { NestFactory } from '@nestjs/core';
import { Queue } from 'bull';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { createBullBoard } from '@bull-board/api';
import { getBotToken } from 'nestjs-telegraf';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
{/* in baza colului din 24.11.24 chestia asta trebuie testata si verificata pentru uramorele deploiuri. 
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
*/}
  const bot = app.get(getBotToken());
  app.use(bot.webhookCallback('/bot'));

  app.enableCors();
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Application Documentation')
      .setDescription('Application APIs')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  if (process.env.IS_BOARD_ACTIVE === 'true') {
    const aQueue = app.get<Queue>(`BullQueue_${COMMUNICATION_QUEUE}`);

    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/queues');

    createBullBoard({
      queues: [new BullAdapter(aQueue)],
      serverAdapter,
    });

    app.use('/queues', serverAdapter.getRouter());
  }

  await app.listen(process.env.APP_PORT);
}

bootstrap();
