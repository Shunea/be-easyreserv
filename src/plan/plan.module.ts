import { Module } from '@nestjs/common';
import { Plan } from './entities/plan.entity';
import { PlanController } from './controllers/plan.controller';
import { PlanHistory } from './entities/planHistory.entity';
import { PlanHistoryController } from './controllers/planHistory.controller';
import { PlanHistoryService } from './services/planHistory.service';
import { PlanService } from './services/plan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@src/user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, PlanHistory, User])],
  exports: [PlanService, PlanHistoryService],
  controllers: [PlanController, PlanHistoryController],
  providers: [PlanService, PlanHistoryService],
})
export class PlanModule {}
