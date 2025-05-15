import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantController } from './controllers/restaurant.controller';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './services/restaurant.service';
import { Space } from '@src/place/entities/space.entity';
import { Place } from '@src/place/entities/place.entity';
import { Table } from '@src/table/entities/table.entity';
import { GetCoordinates } from '@src/common/geolocation/getCoordinatesByAddress';
import { PlanHistoryService } from '@src/plan/services/planHistory.service';
import { PlanHistory } from '@src/plan/entities/planHistory.entity';
import { User } from '@src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Restaurant,
      Place,
      Space,
      Table,
      PlanHistory,
      User,
    ]),
  ],
  exports: [RestaurantService],
  controllers: [RestaurantController],
  providers: [RestaurantService, GetCoordinates, PlanHistoryService],
})
export class RestaurantModule {}
