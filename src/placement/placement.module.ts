import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlacementController } from '@src/placement/controllers/placement.controller';
import { Placement } from '@src/placement/entities/placement.entity';
import { PlacementService } from '@src/placement/services/placement.service';
import { User } from '@src/user/entities/user.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Place } from '@src/place/entities/place.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Placement, User, Place, Restaurant])],
  controllers: [PlacementController],
  providers: [PlacementService],
  exports: [PlacementService],
})
export class PlacementModule {}
