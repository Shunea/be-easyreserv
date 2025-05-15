import { Module } from '@nestjs/common';
import { StockController } from './controllers/stock.controller';
import { StockService } from './services/stock.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Suplier } from '@src/suplier/entities/suplier.entity';
import { Stock } from './entities/stock.entity';
import { EmailService } from '@src/common/email/form/email.form';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Document } from '@src/document/entities/document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stock, Suplier, Restaurant, Document])],
  exports: [StockService],
  controllers: [StockController],
  providers: [StockService, EmailService],
})
export class StockModule {}
