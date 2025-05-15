import { Module } from '@nestjs/common';
import { InvoiceController } from './controllers/invoice.controller';
import { InvoiceService } from './services/invoice.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '@src/invoice/entities/invoice.entity';
import { User } from '@src/user/entities/user.entity';
import { Place } from '@src/place/entities/place.entity';
import { PlanHistory } from '@src/plan/entities/planHistory.entity';
import { Plan } from '@src/plan/entities/plan.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      User,
      Place,
      PlanHistory,
      Plan,
      Restaurant,
    ]),
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule {}
