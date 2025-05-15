import { ApiTags } from '@nestjs/swagger';
import { BillingPeriod } from '../enum/billingPeriod.enum';
import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { PlaceType } from '@src/place/enums/place.type.enum';
import { Plan } from '../entities/plan.entity';
import { PlanService } from '../services/plan.service';

@ApiTags('Plan')
@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get('/')
  async getAllByBusinessType(
    @Query('businessType') businessType: PlaceType,
    @Query('billingPeriod') billingPeriod: BillingPeriod,
    @Res() response: any,
  ): Promise<Plan[]> {
    const plans = await this.planService.getAllByBusinessType(
      businessType,
      billingPeriod,
    );
    return response.status(HttpStatus.OK).json(plans);
  }
}
