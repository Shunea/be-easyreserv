import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './controllers/statistics.controller';
import { StatisticsService } from './services/statistics.service';
import { Reservation } from '@src/reservation/entities/reservation.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Place } from '@src/place/entities/place.entity';
import { Table } from '@src/table/entities/table.entity';
import { MobileStatisticsService } from './services/mobile-statistics.service';
import { MobileStatisticsController } from './controllers/mobile-statistic.controller';
import { Product } from '@src/product/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Restaurant, Place, Table, Product]),
  ],
  controllers: [StatisticsController, MobileStatisticsController],
  providers: [StatisticsService, MobileStatisticsService],
})
export class StatisticsModule {}
