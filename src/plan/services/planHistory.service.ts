import * as dotenv from 'dotenv';
import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { BillingPeriod } from '../enum/billingPeriod.enum';
import { CreatePlanHistoryDto } from '../dto/createPlanHistory.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanHistory } from '../entities/planHistory.entity';
import { Repository } from 'typeorm';
import { Role } from '@src/user/enums/roles.enum';
import { UpdatePlanHistoryDto } from '../dto/updatePlanHistory.dto';
import { User } from '@src/user/entities/user.entity';
import { getPaginated } from '@src/common/pagination';

dotenv.config();

@Injectable()
export class PlanHistoryService {
  private alias = 'plan_history';

  constructor(
    @InjectRepository(PlanHistory)
    private planHistoryRepository: Repository<PlanHistory>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    body: Partial<CreatePlanHistoryDto>,
    user: AuthUser,
  ): Promise<PlanHistory> {
    const startTrialPeriod = new Date();
    const endTrialPeriod = new Date(startTrialPeriod);

    endTrialPeriod.setDate(endTrialPeriod.getDate() + 30);

    const newPlanHistory = new PlanHistory();
    newPlanHistory.userId = body.userId || user.id;
    newPlanHistory.isActive = false;
    newPlanHistory.isPaid = false;
    newPlanHistory.isTrialPeriod = true;
    newPlanHistory.startTrialPeriod = startTrialPeriod;
    newPlanHistory.endTrialPeriod = endTrialPeriod;
    newPlanHistory.planId = body.planId;
    newPlanHistory.restaurantId = body.restaurantId || null;

    try {
      return await this.planHistoryRepository.save(newPlanHistory);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getAll(user: AuthUser, filter: IFilter): Promise<PlanHistory[]> {
    const { limit, skip, all } = filter;
    const columns = [];

    try {
      const queryBuilder = this.planHistoryRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .where('plan_history.user_id = :userId', { userId: user.id })
        .andWhere('plan_history.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('plan_history.deleted_at IS NULL');

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);

      queryBuilder.groupBy('plan_history.id');

      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const planHistories = await queryBuilder.getMany();
      const planHistoriesCount = await queryBuilder.getCount();

      const result = getPaginated({
        data: planHistories,
        count: planHistoriesCount,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getStatus(user: AuthUser, response: any): Promise<any> {
    try {
      const planHistories = await this.planHistoryRepository
        .createQueryBuilder(this.alias)
        .leftJoinAndSelect(
          'plan_history.plan',
          'plan',
          'plan.deleted_at IS NULL',
        )
        .where('plan_history.user_id = :userId', { userId: user.id })
        .andWhere('plan_history.deleted_at IS NULL')
        .getMany();

      if (!planHistories.length) {
        throw new HttpException(
          ERROR_MESSAGES.planHistoryNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const currentDate = new Date();
      const result = planHistories.map((planHistory) => {
        const {
          isTrialPeriod,
          endTrialPeriod,
          nextBillingDate,
          isPaid,
          plan: { type: planType },
          restaurantId,
        } = planHistory;
        const isExpired =
          (isTrialPeriod && currentDate > new Date(endTrialPeriod)) ||
          (isPaid && currentDate > new Date(nextBillingDate));

        return {
          restaurantId,
          isTrial: isTrialPeriod,
          planType,
          isExpired,
        };
      });

      return response.status(HttpStatus.OK).json(result);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getById(planHistoryId: string, response: any): Promise<PlanHistory> {
    const planHistory = await this.planHistoryRepository.findOne({
      where: {
        id: planHistoryId,
        deletedAt: null,
      },
    });

    if (!planHistory) {
      throw new HttpException(
        ERROR_MESSAGES.planHistoryNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return response.status(HttpStatus.OK).json(planHistory);
  }

  async getWithoutRestaurantByUserId(userId: string): Promise<PlanHistory> {
    const planHistory = await this.planHistoryRepository
      .createQueryBuilder(this.alias)
      .where('plan_history.user_id = :userId', { userId })
      .andWhere('plan_history.restaurant_id IS NULL')
      .andWhere('plan_history.deleted_at IS NULL')
      .orderBy('plan_history.created_at', 'DESC')
      .getOne();

    return planHistory;
  }

  async getCurrentPlan(userId: string, restaurantId: string): Promise<any> {
    userId = await this.getOwnerId(userId);

    const plan = await this.planHistoryRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect('plan_history.plan', 'plan', 'plan.deleted_at IS NULL')
      .select([
        'plan.id as id',
        'plan.created_at as createdAt',
        'plan.updated_at as updatedAt',
        'plan.deleted_At as deletedAt',
        'plan.name as name',
        'plan.price as price',
        'plan.type as type',
        'plan.billing_period as billingPeriod',
        'plan.place_type as placeType',
      ])
      .where('plan_history.user_id = :userId', { userId })
      .andWhere('plan_history.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('plan_history.deleted_at IS NULL')
      .getRawOne();

    if (!plan) {
      throw new HttpException(
        ERROR_MESSAGES.planNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return plan;
  }

  async update(
    planHistoryId: string,
    updatePlanHistoryDto: Partial<UpdatePlanHistoryDto>,
  ): Promise<any> {
    const planHistory = await this.planHistoryRepository
      .createQueryBuilder(this.alias)
      .where('plan_history.id = :planHistoryId', { planHistoryId })
      .andWhere('plan_history.deleted_at IS NULL')
      .getOne();

    if (!planHistory) {
      throw new HttpException(
        ERROR_MESSAGES.planHistoryNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const updatedPlanHistory = this.planHistoryRepository.create({
      ...planHistory,
      ...updatePlanHistoryDto,
    });

    await this.planHistoryRepository.save(updatedPlanHistory);

    return updatedPlanHistory;
  }

  async delete(planHistoryId: string, response: any) {
    const planHistory = await this.planHistoryRepository
      .createQueryBuilder(this.alias)
      .where('plan_history.id = :planHistoryId', { planHistoryId })
      .andWhere('plan_history.deleted_at IS NULL')
      .getOne();

    if (!planHistory) {
      throw new HttpException(
        ERROR_MESSAGES.planHistoryNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.planHistoryRepository.softDelete(planHistoryId);

    return response.status(HttpStatus.OK).json({ deleted: true });
  }

  private async getOwnerId(userId: string): Promise<string> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .andWhere('user.deleted_at IS NULL')
      .getOne();

    userId =
      user && user.role !== Role.SUPER_ADMIN && user.createdBy
        ? user.createdBy
        : userId;

    return userId;
  }

  private calculateNextBillingDate(
    billingPeriod: BillingPeriod,
    billingDate: Date,
  ): Date {
    const currentDate = new Date();
    let nextBillingDate: Date;

    switch (billingPeriod) {
      case BillingPeriod.MONTHLY:
        nextBillingDate = new Date(billingDate);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 30);
        break;
      case BillingPeriod.ANNUALLY:
        nextBillingDate = new Date(billingDate);
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 365);
        break;
      default:
        nextBillingDate = currentDate;
    }

    return nextBillingDate;
  }
}
