import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewController } from './controllers/review.controller';
import { Review } from './entities/review.entity';
import { ReviewService } from './services/review.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review])],
  exports: [ReviewService],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
