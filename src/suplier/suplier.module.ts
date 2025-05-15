import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuplierService } from './services/suplier.service';
import { SuplierController } from './controller/suplier.controller';
import { Suplier } from './entities/suplier.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Suplier, Restaurant])],
  exports: [SuplierService],
  controllers: [SuplierController],
  providers: [SuplierService],
})
export class SuplierModule {}
