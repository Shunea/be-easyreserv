import { Module } from '@nestjs/common';
import { Place } from '@src/place/entities/place.entity';
import { QRCode } from './entities/qrCode.entity';
import { QRCodeService } from './services/qrCode.service';
import { QRController } from './controllers/qrCode.controller';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Schedule } from '@src/user/entities/schedule.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Place, QRCode, Restaurant, Schedule, User]),
  ],
  exports: [QRCodeService],
  controllers: [QRController],
  providers: [QRCodeService],
})
export class QRModule {}
