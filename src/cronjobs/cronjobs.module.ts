import { Module } from '@nestjs/common';
import { NotificationModule } from '@src/notification/notification.module';
import { QRCode } from '@src/qrCode/entities/qrCode.entity';
import { QRCodeCronjobService } from './qrCodeCronjob.service';
import { Reservation } from '@src/reservation/entities/reservation.entity';
import { ReservationReminderCronjobService } from './reservationReminderCronjob.service';
import { ScheduleModule } from '@nestjs/schedule';
import { Stock } from '@src/stock/entities/stock.entity';
import { StockCronjobService } from './stockCronjob.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@src/user/entities/user.entity';
import { Vacation } from '@src/user/entities/vacation.entity';
import { VacationCronjobService } from './vacationCronjob.service';
import { ReservationCloseCronjobService } from './reservationCloseCronjob.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Vacation, QRCode, Stock, Reservation, User]),
    NotificationModule,
  ],
  controllers: [],
  providers: [
    VacationCronjobService,
    QRCodeCronjobService,
    StockCronjobService,
    ReservationReminderCronjobService,
    ReservationCloseCronjobService,
  ],
})
export class CronjobsModule {}
