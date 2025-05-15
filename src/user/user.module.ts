import * as dotenv from 'dotenv';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from '@src/auth/services/auth.service';
import { EmailService } from '@src/common/email/form/email.form';
import { Schedule } from './entities/schedule.entity';
import { ScheduleController } from './controllers/schedule.controller';
import { ScheduleService } from './services/schedule.service';
import { Purpose } from './entities/purpose.entity';
import { Vacation } from './entities/vacation.entity';
import { VacationService } from './services/vacation.service';
import { VacationController } from './controllers/vacation.controller';
import { CreateInitialVacation } from '@src/common/createInitialVacations';
import { TokenKey } from '@src/tokenKey/entities/tokenKey.entity';
import { TokenKeyService } from '@src/tokenKey/services/tokenKey.service';
import { TokenKeyController } from '@src/tokenKey/controllers/tokenKey.controller';
import { Plan } from '@src/plan/entities/plan.entity';
import { PlanService } from '@src/plan/services/plan.service';
import { PlanHistory } from '@src/plan/entities/planHistory.entity';
import { PlanHistoryService } from '@src/plan/services/planHistory.service';
import { RefreshToken } from '@src/refreshToken/entities/refreshToken.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { NotificationService } from '@src/notification/services/notification.service';
import { NotificationToken } from '@src/notification/entities/notification-token.entity';
import { Notification } from '@src/notification/entities/notification.entity';
import { BullModule } from '@nestjs/bull';
import { COMMUNICATION_QUEUE } from '@src/queues/constants';
import { JobEntity } from '@src/notification/entities/job.entity';
import { WaiterCodeService } from './services/waiter-code.service';
import { WaiterCodeController } from './controllers/waiter-code.controller';

dotenv.config();

@Module({
  imports: [
    BullModule.registerQueue({
      name: COMMUNICATION_QUEUE,
    }),
    TypeOrmModule.forFeature([
      User,
      Vacation,
      Schedule,
      Purpose,
      TokenKey,
      Plan,
      PlanHistory,
      RefreshToken,
      Restaurant,
      Notification,
      NotificationToken,
      JobEntity,
    ]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.ACCESS_TOKEN_SECRET_KEY,
        signOptions: {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
        },
      }),
    }),
    ConfigModule.forRoot(),
  ],
  exports: [
    UserService,
    ScheduleService,
    VacationService,
    TokenKeyService,
    PlanService,
    PlanHistoryService,
    NotificationService,
    WaiterCodeService,
  ],
  controllers: [
    UserController,
    ScheduleController,
    VacationController,
    TokenKeyController,
    WaiterCodeController,
  ],
  providers: [
    UserService,
    ScheduleService,
    AuthService,
    EmailService,
    VacationService,
    CreateInitialVacation,
    TokenKeyService,
    PlanService,
    PlanHistoryService,
    NotificationService,
    WaiterCodeService,
  ],
})
export class UserModule {}
