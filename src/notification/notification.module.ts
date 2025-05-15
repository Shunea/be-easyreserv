import { Module } from '@nestjs/common';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { NotificationToken } from './entities/notification-token.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { COMMUNICATION_QUEUE } from '../queues/constants';
import { JobEntity } from './entities/job.entity';
import { NotificationController } from './controllers/notification.controller';
import { User } from '@src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationToken,
      JobEntity,
      User,
    ]),
    BullModule.registerQueue({
      name: COMMUNICATION_QUEUE,
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
