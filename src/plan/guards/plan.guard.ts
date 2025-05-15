import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DUMMY_ID, ERROR_MESSAGES } from '@src/constants';
import { EntityManager } from 'typeorm';
import { Plan } from '../entities/plan.entity';
import { PlanHistory } from '../entities/planHistory.entity';
import { Reflector } from '@nestjs/core';
import { Role } from '@src/user/enums/roles.enum';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { User } from '@src/user/entities/user.entity';

@Injectable()
export class PlanGuard implements CanActivate {
  private userAlias = 'user';
  private planAlias = 'plan';
  private planHistoryAlias = 'plan_history';

  constructor(
    private readonly reflector: Reflector,
    private readonly entityManager: EntityManager,
  ) {}

  private async getPlanHistory(
    userId: string,
    restaurantId: string,
  ): Promise<PlanHistory> {
    const planHistoryRepository = this.entityManager.getRepository(PlanHistory);
    const queryBuilder = planHistoryRepository
      .createQueryBuilder(this.planHistoryAlias)
      .where('plan_history.user_id = :userId', { userId })
      .andWhere('plan_history.deleted_at IS NULL');

    if (restaurantId !== DUMMY_ID) {
      queryBuilder.andWhere('plan_history.restaurant_id = :restaurantId', {
        restaurantId,
      });
    } else {
      queryBuilder.andWhere('plan_history.restaurant_id IS NULL');
    }

    return await queryBuilder.getOne();
  }

  private async getPlanType(planId: string): Promise<string> {
    const planRepository = this.entityManager.getRepository(Plan);
    const { type } = await planRepository
      .createQueryBuilder(this.planAlias)
      .where('plan.id = :planId', { planId })
      .andWhere('plan.deleted_at IS NULL')
      .getOne();

    return type;
  }

  private isExpired(date: Date): boolean {
    const currentDate = new Date();
    return currentDate > date;
  }

  private async validatePlan(
    user: AuthUser,
    plans: string[],
  ): Promise<boolean> {
    const userRepository = this.entityManager.getRepository(User);
    const employee = await userRepository
      .createQueryBuilder(this.userAlias)
      .where('user.id = :userId', { userId: user.id })
      .andWhere('user.restaurant_id = :restaurantId', {
        restaurantId: user.restaurantId,
      })
      .andWhere('user.role NOT IN (:...roles)', {
        roles: [Role.SUPER_ADMIN, Role.USER],
      })
      .andWhere('user.deleted_at IS NULL')
      .getOne();

    const userId =
      employee && employee.createdBy ? employee.createdBy : user.id;

    const planHistory = await this.getPlanHistory(userId, user.restaurantId);

    if (!planHistory) {
      throw new HttpException(
        ERROR_MESSAGES.planHistoryNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const planType = await this.getPlanType(planHistory.planId);
    const expirationDate = planHistory.isTrialPeriod
      ? new Date(planHistory.endTrialPeriod)
      : new Date(planHistory.nextBillingDate);

    if (this.isExpired(expirationDate)) {
      throw new HttpException(
        planHistory.isTrialPeriod
          ? ERROR_MESSAGES.planTrialPeriodExpired
          : ERROR_MESSAGES.planExpired,
        HttpStatus.BAD_REQUEST,
      );
    }

    return plans.some((plan) => plan === planType);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const plans = this.reflector.get<string[]>('plans', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (!plans || user.role === Role.USER) {
      return true;
    }

    return this.validatePlan(user, plans);
  }
}
