import { Bonus } from './entities/bonus.entity';
import { BonusController } from './controllers/bonus.controller';
import { BonusService } from './services/bonus.service';
import { Module } from '@nestjs/common';
import { Reservation } from '@src/reservation/entities/reservation.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bonus, User, Reservation])],
  exports: [BonusService],
  controllers: [BonusController],
  providers: [BonusService],
})
export class BonusModule {}
