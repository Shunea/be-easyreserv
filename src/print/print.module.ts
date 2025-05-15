import { Module } from '@nestjs/common';
import { Order } from '@src/reservation/entities/order.entity';
import { PrintController } from './controllers/print.controller';
import { PrintService } from './services/print.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [PrintController],
  providers: [PrintService],
})
export class PrintModule {}
