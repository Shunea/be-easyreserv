import { Injectable, OnModuleInit } from '@nestjs/common';
import { PlaceType } from '@src/place/enums/place.type.enum';
import { Plan } from '@src/plan/entities/plan.entity';
import { BillingPeriod } from '@src/plan/enum/billingPeriod.enum';
import { PlanType } from '@src/plan/enum/planType.enum';
import { EntityManager } from 'typeorm';

const PLANS = [
  {
    name: 'Basic',
    price: 100,
    type: PlanType.BASIC,
    billingPeriod: BillingPeriod.MONTHLY,
    placeType: PlaceType.RESTAURANT,
  },
  {
    name: 'Standard',
    price: 350,
    type: PlanType.STANDARD,
    billingPeriod: BillingPeriod.MONTHLY,
    placeType: PlaceType.RESTAURANT,
  },
  {
    name: 'Pro',
    price: 600,
    type: PlanType.PRO,
    billingPeriod: BillingPeriod.MONTHLY,
    placeType: PlaceType.RESTAURANT,
  },
  {
    name: 'Basic',
    price: 1200,
    type: PlanType.BASIC,
    billingPeriod: BillingPeriod.ANNUALLY,
    placeType: PlaceType.RESTAURANT,
  },
  {
    name: 'Standard',
    price: 4200,
    type: PlanType.STANDARD,
    billingPeriod: BillingPeriod.ANNUALLY,
    placeType: PlaceType.RESTAURANT,
  },
  {
    name: 'Pro',
    price: 7200,
    type: PlanType.PRO,
    billingPeriod: BillingPeriod.ANNUALLY,
    placeType: PlaceType.RESTAURANT,
  },
];

@Injectable()
export class PlanInsertionService implements OnModuleInit {
  constructor(private readonly entityManager: EntityManager) {}

  async onModuleInit() {
    await this.insertInitialPlans();
  }

  async insertInitialPlans() {
    const planRepository = this.entityManager.getRepository(Plan);
    const existingPlans = await planRepository.find();

    if (existingPlans.length === 0) {
      for (const planData of PLANS) {
        const newPlan = planRepository.create(planData);
        await planRepository.save(newPlan);
      }
    }
  }
}
