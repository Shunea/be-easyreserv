import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { COMMUNICATION_QUEUE } from '@src/queues/constants';
import { NotificationService } from '@src/notification/services/notification.service';
import { JobEntity } from '@src/notification/entities/job.entity';
import { Notification } from '@src/notification/entities/notification.entity';
import { NotificationToken } from '@src/notification/entities/notification-token.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { User } from '@src/user/entities/user.entity';
import { Product } from '@src/product/entities/product.entity';
import { Plan } from '@src/plan/entities/plan.entity';
import { PlanHistory } from '@src/plan/entities/planHistory.entity';
import { PlanHistoryService } from '@src/plan/services/planHistory.service';

import { DeliveryOrder } from './entities/delivery-order.entity';
import { DeliveryOrderItem } from './entities/delivery-order-item.entity';
import { DeliveryController } from './controllers/delivery.controller';
import { DeliveryService } from './services/delivery.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: COMMUNICATION_QUEUE,
    }),
    TypeOrmModule.forFeature([
      DeliveryOrder,
      DeliveryOrderItem,
      JobEntity,
      Notification,
      NotificationToken,
      Plan,
      PlanHistory,
      Product,
      Restaurant,
      User,
    ]),
  ],
  exports: [DeliveryService],
  controllers: [DeliveryController],
  providers: [DeliveryService, NotificationService, PlanHistoryService],
})
export class DeliveryModule {}
