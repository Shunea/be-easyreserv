import { BillingPeriod } from '../enum/billingPeriod.enum';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlaceType } from '@src/place/enums/place.type.enum';
import { Plan } from '../entities/plan.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PlanService {
  private alias = 'plan';

  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
  ) {}

  async getAllByBusinessType(
    businessType: PlaceType,
    billingPeriod: BillingPeriod,
  ): Promise<Plan[]> {
    try {
      if (!businessType && !billingPeriod) {
        throw new HttpException(
          ERROR_MESSAGES.specifyBusinessTypeAndBillingPeriod,
          HttpStatus.BAD_REQUEST,
        );
      }

      const plans = await this.planRepository
        .createQueryBuilder(this.alias)
        .where('plan.place_type = :businessType', { businessType })
        .andWhere('plan.billing_period = :billingPeriod', { billingPeriod })
        .andWhere('plan.deleted_at IS NULL')
        .orderBy('FIELD(plan.name, "Basic", "Standard", "Pro")')
        .getMany();

      return plans;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getById(planId: string): Promise<Plan> {
    try {
      const plan = this.planRepository.findOneBy({
        id: planId,
        deletedAt: null,
      });

      return plan;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
