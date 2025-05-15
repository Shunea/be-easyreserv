import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunicationService } from './services/communication.service';
import { CommunicationController } from './controllers/communication.controller';
import { Communication } from './entities/communication.entity';
import { UserModule } from '@src/user/user.module';
import { NotificationModule } from '@src/notification/notification.module';
import { JobEntity } from '@src/notification/entities/job.entity';
import { BullModule } from '@nestjs/bull';
import { CommunicationTypes } from './entities/communication_types.entity';
import { CommunicationTypesService } from './services/communication_types.service';
import { CommunicationTypeController } from './controllers/communication_types.controller';
import { COMMUNICATION_QUEUE } from '@src/queues/constants';
import { FilterMethods } from './helper/filter-methods';
import { User } from '@src/user/entities/user.entity';
import { HttpModule } from '@nestjs/axios';
import { SmsService } from '@src/comunication/services/sms.service';

@Module({
  imports: [HttpModule,
    TypeOrmModule.forFeature([
      Communication,
      JobEntity,
      CommunicationTypes,
      User,
    ]),
    BullModule.registerQueue({
      name: COMMUNICATION_QUEUE,
    }),
    UserModule,
    NotificationModule,
  ],
  controllers: [CommunicationController, CommunicationTypeController],
  providers: [CommunicationService, CommunicationTypesService, FilterMethods, SmsService],
})
export class CommunicationModule {}
