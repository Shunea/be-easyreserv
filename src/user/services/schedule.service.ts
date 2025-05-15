import * as moment from 'moment';
import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreatePurposeDto } from '../dto/createPurpose.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { Purpose } from '../entities/purpose.entity';
import { PurposeStatus } from '../enums/purpose-status.enum';
import { Repository } from 'typeorm';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Schedule } from '../entities/schedule.entity';
import { StaffRole } from '../enums/staff.roles.enum';
import { StaffScheduleDto } from '../dto/createSchedule';
import { UpdatePurposeDto } from '../dto/updatePurpose.dto';
import { User } from '../entities/user.entity';
import { getPaginated } from '@src/common/pagination';
import { plainToClass } from 'class-transformer';

const ALLOW_OVERLAP = true;

@Injectable()
export class ScheduleService {
  private scheduleAlias = 'schedule';
  private alias = 'purpose';

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,

    @InjectRepository(Purpose)
    private purposeRepository: Repository<Purpose>,

    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
  ) {}

  async createSchedule(
    user: AuthUser,
    staffId: string,
    schedulesDto: StaffScheduleDto[],
  ): Promise<any> {
    const scheduleResponses: any[] = [];
    try {
      const staff = await this.userRepository.findOne({
        where: { id: staffId, deletedAt: null },
      });

      if (!staff) {
        throw new HttpException(
          ERROR_MESSAGES.userNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (staff.createdBy !== user.id) {
        throw new HttpException(ERROR_MESSAGES.forbidden, HttpStatus.FORBIDDEN);
      }

      const restaurant = await this.restaurantRepository.findOne({
        where: { id: user.restaurantId, deletedAt: null },
      });

      if (!restaurant) {
        throw new HttpException(
          ERROR_MESSAGES.restaurantNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      for (const schedule of schedulesDto) {
        let existingSchedule = null;
        if (!ALLOW_OVERLAP) {
        existingSchedule = await this.scheduleRepository.findOne({
          where: {
            userId: staff.id,
            date: schedule.date,
            deletedAt: null,
          },
        })}

        if (!ALLOW_OVERLAP && existingSchedule) {
          scheduleResponses.push({
            error: ERROR_MESSAGES.scheduleDateConflicts,
            schedule: {
              id: existingSchedule.id,
              staffSchedule: { ...schedule },
              userId: staff.id,
            },
          });
        } else {
          const workingHours = calculateWorkingHours(schedule);
          
          const MAX_HOURS = 20;
          schedule.workHours = workingHours > MAX_HOURS ? 0 : workingHours;
          schedule.date = new Date(schedule.date);

          const roles = [
            StaffRole.CHEF,
            StaffRole.HOSTESS,
            StaffRole.SUPER_HOSTESS,
            StaffRole.OPERATOR,
            StaffRole.SPECIALIST,
          ];

          if (roles.includes(staff.role as StaffRole)) {
            //schedule.floor = restaurant.name;
          }

          const staffSchedule = await this.scheduleRepository.save({
            ...schedule,
            staff,
            userId: staff.id,
          });

          scheduleResponses.push({
            id: staffSchedule.id,
            staffSchedule: { ...schedule },
            userId: staff.id,
          });
        }
      }

      console.log("scheduleResponses", scheduleResponses);
      return scheduleResponses;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getSchedule(filter: IFilter, userId: string): Promise<any> {
    try {
      const { limit, skip, all } = filter;
      const columns = ['status', 'date'];

      const queryBuilder = this.scheduleRepository.createQueryBuilder(
        this.scheduleAlias,
      );

      queryBuilder
        .where('schedule.user_id = :id', { id: userId })
        .andWhere('schedule.deleted_at IS NULL');

      FilterUtils.applyFilters(queryBuilder, this.scheduleAlias, filter);
      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.scheduleAlias,
        'date',
        filter,
      );
      FilterUtils.applySearch(
        queryBuilder,
        this.scheduleAlias,
        filter,
        columns,
      );

      queryBuilder
        .groupBy('schedule.id')
        .addGroupBy('schedule.date')
        .addGroupBy('schedule.floor')
        .addGroupBy('schedule.status')
        .orderBy('date', 'DESC');

      FilterUtils.applySorting(queryBuilder, this.scheduleAlias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const countSchedules = await queryBuilder.getCount();
      const schedule = await queryBuilder.getMany();

      const result = getPaginated({
        data: schedule,
        count: countSchedules,
        skip,
        limit,
        all,
      });

      if (!schedule) {
        throw new HttpException(
          ERROR_MESSAGES.userNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      return prettify(result);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getScheduleByDate(
    userId: string,
    date: Date,
    previousDays: number,
    upcomingDays: number,
  ): Promise<Schedule[]> {
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const user = await this.userRepository.findOne({
        where: { id: userId, deletedAt: null },
      });
      if (!user) {
        throw new HttpException(
          ERROR_MESSAGES.userNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const upcomingDaysLimited = Math.min(upcomingDays, lastDayOfMonth - day);
      const startDate = new Date(year, month - 1, day - previousDays);
      const endDate = new Date(year, month, day + upcomingDaysLimited);

      const queryBuilder = this.scheduleRepository.createQueryBuilder(
        this.scheduleAlias,
      );

      queryBuilder
        .where(`schedule.user_id = :id`, { id: userId })
        .leftJoinAndSelect(
          'schedule.purposes',
          'purposes',
          'purposes.deleted_at IS NULL',
        )
        .andWhere(`(schedule.date BETWEEN :startDate AND :endDate)`, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .andWhere('schedule.deleted_at IS NULL')
        .orderBy('schedule.date', 'ASC');

      const schedules = await queryBuilder.getMany();

      for (const schedule of schedules) {
        if (schedule.purposes.length > 0) {
          schedule['purpose'] = schedule.purposes.find(
            (purpose) =>
              purpose.date.getFullYear() === schedule.date.getFullYear() &&
              purpose.date.getMonth() === schedule.date.getMonth() &&
              purpose.date.getDate() === schedule.date.getDate(),
          );
        }

        delete schedule.purposes;
      }

      return schedules;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateScheduleById(
    user: AuthUser,
    staffId: string,
    scheduleId: string,
    scheduleDto: StaffScheduleDto,
  ): Promise<any> {
    try {
      const staff = await this.userRepository.findOne({
        where: { id: staffId, deletedAt: null },
      });

      if (!staff) {
        throw new HttpException(
          ERROR_MESSAGES.userNotFound,
          HttpStatus.NOT_FOUND,
        );
      }
      if (user.id !== staff.createdBy) {
        throw new HttpException(ERROR_MESSAGES.forbidden, HttpStatus.FORBIDDEN);
      }

      const schedule = await this.scheduleRepository.findOne({
        where: {
          id: scheduleId,
          deletedAt: null,
        },
      });

      if (!schedule) {
        throw new HttpException(
          ERROR_MESSAGES.scheduleNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (schedule.userId !== staff.id) {
        throw new HttpException(ERROR_MESSAGES.forbidden, HttpStatus.FORBIDDEN);
      }

      const updatedSchedule = this.scheduleRepository.create({
        ...schedule,
        ...scheduleDto,
      });

      await this.scheduleRepository.save(updatedSchedule);

      return updatedSchedule;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async updateScheduleByTitle(
    user: AuthUser,
    staffId: string,
    title: string,
    scheduleDto: StaffScheduleDto,
    response: any,
  ): Promise<any> {
    const updatedSchedule = [];
    const staff = await this.userRepository.findOne({
      where: { id: staffId, deletedAt: null },
    });

    if (!staff) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: ERROR_MESSAGES.staffNotFound,
      });
    }

    if (user.id !== staff.createdBy) {
      throw new HttpException(ERROR_MESSAGES.forbidden, HttpStatus.FORBIDDEN);
    }

    const schedules = await this.scheduleRepository.find({
      where: { title, deletedAt: null },
    });

    if (!schedules || schedules.length === 0) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: ERROR_MESSAGES.scheduleNotFound,
      });
    }

    await Promise.all(
      schedules.map(async (schedule) => {
        if (schedule.date >= new Date()) {
          const hasSpaceWithMatchingMainEntityId = schedule.userId === staff.id;

          if (hasSpaceWithMatchingMainEntityId) {
            const scheduleToUpdate = this.scheduleRepository.create({
              ...schedule,
              ...scheduleDto,
            });

            await this.scheduleRepository.save(scheduleToUpdate);

            updatedSchedule.push(scheduleToUpdate);
          }
        } else
          new HttpException(ERROR_MESSAGES.expiredDate, HttpStatus.BAD_REQUEST);
      }),
    );

    return response.status(HttpStatus.OK).json(updatedSchedule);
  }

  async deleteSchedule(user: AuthUser, staffId: string, scheduleId: string) {
    try {
      const schedule = await this.scheduleRepository.findOne({
        where: { id: scheduleId, deletedAt: null },
        relations: ['purposes'],
      });

      if (!schedule) {
        throw new HttpException(
          ERROR_MESSAGES.scheduleNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (schedule.date < new Date()) {
        throw new HttpException(
          ERROR_MESSAGES.expiredDate,
          HttpStatus.BAD_REQUEST,
        );
      }

      const staff = await this.userRepository.findOneBy({
        id: staffId,
        deletedAt: null,
      });

      if (staff.createdBy !== user.id) {
        throw new HttpException(ERROR_MESSAGES.forbidden, HttpStatus.FORBIDDEN);
      }

      await this.scheduleRepository.softRemove(schedule);

      return { deleted: true };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteScheduleByTitle(user: AuthUser, staffId: string, title: string) {
    const schedules = await this.scheduleRepository.find({
      where: { title: title, deletedAt: null },
      relations: ['purposes'],
    });

    if (!schedules) {
      throw new HttpException(
        ERROR_MESSAGES.scheduleNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const staff = await this.userRepository.findOne({
      where: { id: staffId, deletedAt: null },
    });

    if (!staff || staff.createdBy !== user.id) {
      throw new HttpException(ERROR_MESSAGES.forbidden, HttpStatus.FORBIDDEN);
    }

    const purposeIds = schedules.reduce(
      (acc, schedule) =>
        acc.concat(schedule.purposes.map((purpose) => purpose.id)),
      [],
    );

    if (purposeIds.length > 0) {
      await this.purposeRepository
        .createQueryBuilder()
        .whereInIds(purposeIds)
        .softDelete()
        .execute();
    }

    await this.scheduleRepository
      .createQueryBuilder(this.scheduleAlias)
      .softDelete()
      .from(Schedule)
      .where('schedule.title = :title', { title })
      .andWhere('schedule.date > :currentDate', { currentDate: new Date() })
      .andWhere('schedule.user_id = :staffId', { staffId })
      .execute();

    return { deleted: true };
  }

  async getAllSchedules(user: AuthUser, filter: IFilter): Promise<any> {
    try {
      const columns = ['check_status', 'date'];

      //console.log("filter", filter);
      const queryBuilder = this.scheduleRepository.createQueryBuilder(this.scheduleAlias);

      queryBuilder
        .leftJoinAndSelect('schedule.user', 'user')
        .where('schedule.deleted_at IS NULL')
        .andWhere('user.restaurant_id = :restaurantId', { 
          restaurantId: user.restaurantId 
        });

      if (filter.filter?.month) {
        const dates = getAllDatesInMonth(filter.filter.month);
        filter.filter.startDate = dates[0];
        filter.filter.endDate = dates[dates.length - 1];
        delete filter.filter.month;
      }

      FilterUtils.applyFilters(queryBuilder, this.scheduleAlias, filter);
      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.scheduleAlias,
        'date',
        filter,
      );
      FilterUtils.applySearch(
        queryBuilder,
        this.scheduleAlias,
        filter,
        columns,
      );

      queryBuilder
        .groupBy('schedule.id')
        .addGroupBy('schedule.date')
        .addGroupBy('schedule.floor')
        .addGroupBy('schedule.check_status')
        .addGroupBy('user.id');

      FilterUtils.applySorting(queryBuilder, this.scheduleAlias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const [schedules, total] = await queryBuilder.getManyAndCount();

      return {
        data: schedules,
        total,
        page: Math.floor((filter.skip || 0) / (filter.limit || 10)) + 1,
        pageSize: filter.limit || 10,
        totalPages: Math.ceil(total / (filter.limit || 10))
      };

    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllPurposes(filter: IFilter, userId: string): Promise<Purpose[]> {
    try {
      const { limit, skip, all } = filter;
      const columns = ['date'];
      const queryBuilder = this.purposeRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .where('purpose.user_id = :id', { id: userId })
        .andWhere('purpose.deleted_at IS NULL');

      FilterUtils.applyRangeFilter(queryBuilder, this.alias, 'date', filter);
      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);

      queryBuilder
        .groupBy('purpose.id')
        .addGroupBy('purpose.status')
        .addGroupBy('purpose.date');

      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const purposes = await queryBuilder.getMany();
      const countPurposes = await queryBuilder.getCount();

      const result = getPaginated({
        data: purposes,
        count: countPurposes,
        skip,
        limit,
        all,
      });
      return prettify(result);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async createPurpose(
    user: AuthUser,
    scheduleId: string,
    createPurposeDto: CreatePurposeDto,
  ): Promise<Purpose> {
    if (!user) {
      throw new HttpException(
        ERROR_MESSAGES.userNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const schedule = await this.scheduleRepository.findOne({
      where: {
        id: scheduleId,
        deletedAt: null,
      },
    });

    if (!schedule) {
      throw new HttpException(
        ERROR_MESSAGES.scheduleNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const purpose = plainToClass(Purpose, createPurposeDto);

    purpose.userId = user.id;
    purpose.scheduleId = schedule.id;
    purpose.date = schedule.date;

    const existingPurpose = await this.purposeRepository.findOne({
      where: { scheduleId, deletedAt: null },
    });

    if (existingPurpose) {
      throw new HttpException(
        ERROR_MESSAGES.purposeAlreadyRegistered,
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.purposeRepository.save(purpose);

    return result;
  }

  async updatePurpose(
    scheduleId: string,
    purposeId: string,
    updatePurposeDto: UpdatePurposeDto,
  ): Promise<any> {
    const schedule = await this.scheduleRepository.findOne({
      where: {
        id: scheduleId,
        deletedAt: null,
      },
    });

    if (!schedule) {
      throw new HttpException(
        ERROR_MESSAGES.scheduleNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const purpose = await this.purposeRepository.findOne({
      where: { id: purposeId, deletedAt: null },
    });

    if (!purpose) {
      throw new HttpException(
        ERROR_MESSAGES.purposesNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    Object.assign(purpose, updatePurposeDto);

    await this.purposeRepository.save(purpose);

    if (purpose.status == PurposeStatus.APPROVED) {
      const workingHours = calculateWorkingHours(purpose);

      schedule.startTime = purpose.startTime;
      schedule.endTime = purpose.endTime;
      schedule.workHours = workingHours;

      await this.scheduleRepository.save(schedule);
    }

    return purpose;
  }

  async deletePurpose(purposeId: string) {
    const purpose = await this.purposeRepository.findOne({
      where: { id: purposeId, deletedAt: null },
    });

    if (!purpose) {
      throw new HttpException(
        ERROR_MESSAGES.purposesNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.purposeRepository.softDelete(purpose.id);
    return { deleted: true };
  }
}

function calculateWorkingHours(entity: any) {
  const { startTime, endTime } = entity;
  const startMoment = moment(startTime, 'HH:mm:ss');
  const endMoment = moment(endTime, 'HH:mm:ss');

  const workingHours =
    startMoment.isSame(endMoment) || endMoment.isBefore(startMoment)
      ? endMoment.clone().add(1, 'day').diff(startMoment, 'hours', true)
      : endMoment.diff(startMoment, 'hours', true);

  return workingHours;
}

function getAllDatesInMonth(monthString: string): string[] {
  const [year, month] = monthString.split('-').map(Number); // Extract year and month
  const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month

  const dates = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(
      day,
    ).padStart(2, '0')}`;
    dates.push(date);
  }

  return dates;
}
