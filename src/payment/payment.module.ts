import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './services/payment.service';
import { PaymentController } from './controllers/payment.controller';
import { PaymentAccount } from './entities/payment-account.entity';
import { User } from '@src/user/entities/user.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentAccount, User, Restaurant])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
