import { BonusModule } from '@src/bonus/bonus.module';
import { BullModule } from '@nestjs/bull';
import { COMMUNICATION_QUEUE } from '@src/queues/constants';
import { JobEntity } from '@src/notification/entities/job.entity';
import { Module } from '@nestjs/common';
import { Notification } from '@src/notification/entities/notification.entity';
import { NotificationService } from '@src/notification/services/notification.service';
import { NotificationToken } from '@src/notification/entities/notification-token.entity';
import { Order } from './entities/order.entity';
import { OrderCommon } from './order-common/order.common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { Place } from '@src/place/entities/place.entity';
import { Plan } from '@src/plan/entities/plan.entity';
import { PlanHistory } from '@src/plan/entities/planHistory.entity';
import { PlanHistoryService } from '@src/plan/services/planHistory.service';
import { Product } from '@src/product/entities/product.entity';
import { Reservation } from './entities/reservation.entity';
import { ReservationController } from './controllers/reservation.controller';
import { ReservationService } from './services/reservation.service';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Stock } from '@src/stock/entities/stock.entity';
import { Table } from '@src/table/entities/table.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@src/user/entities/user.entity';
import { UserModule } from '@src/user/user.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: COMMUNICATION_QUEUE,
    }),
    TypeOrmModule.forFeature([
      JobEntity,
      Notification,
      NotificationToken,
      Order,
      Place,
      Plan,
      PlanHistory,
      Product,
      Reservation,
      Restaurant,
      Stock,
      Table,
      User,
    ]),
    BonusModule,
    UserModule,
  ],
  exports: [ReservationService, OrderService, OrderCommon],
  controllers: [ReservationController, OrderController],
  providers: [
    NotificationService,
    OrderCommon,
    OrderService,
    PlanHistoryService,
    ReservationService,
  ],
})
export class ReservationModule {}
