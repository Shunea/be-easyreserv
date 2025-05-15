import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from '@src/notification/entities/job.entity';
import { NotificationModule } from '@src/notification/notification.module';
import { CommunicationProcessor } from './communication/communication.processor';
import { BullModule } from '@nestjs/bull';
import { COMMUNICATION_QUEUE } from './constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity]),
    BullModule.registerQueue({
      name: COMMUNICATION_QUEUE,
    }),
    NotificationModule,
  ],
  providers: [CommunicationProcessor],
  controllers: [],
  exports: [],
})
export class QueuesModule {}
