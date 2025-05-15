import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateVacationDto } from '../dto/createVacation.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateVacationDto } from '../dto/updateVacation.dto';
import { UpdateVacationStatusDto } from '../dto/updateVacarionStatus.dto';
import { User } from '../entities/user.entity';
import { Vacation } from '../entities/vacation.entity';
import { VacationStatus } from '../enums/vacation_status.enum';
import { VacationType } from '../enums/vacation-type.enum';
import { getPaginated } from '@src/common/pagination';

@Injectable()
export class VacationService {
  private alias = 'vacation';

  constructor(
    @InjectRepository(Vacation)
    private vacationRepository: Repository<Vacation>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAll(filter: IFilter, userId: string): Promise<Vacation[]> {
    try {
      const columns = ['start_date', 'end_date', 'vacation_type'];
      const { limit, skip, all } = filter;

      const queryBuilder = this.vacationRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .where('vacation.user_id = :id', { id: userId })
        .andWhere('vacation.deleted_at IS NULL')
        .orderBy('vacation.created_at', 'ASC');

      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.alias,
        'start_date',
        filter,
      );

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);

      queryBuilder
        .groupBy('vacation.id')
        .addGroupBy('vacation.vacation_type')
        .addGroupBy('vacation.vacation_identifier');

      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const vacations = await queryBuilder.getMany();

      const countVacations = await queryBuilder.getCount();

      const result = getPaginated({
        data: vacations,
        count: countVacations,
        skip,
        limit,
        all,
      });
      return prettify(result);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getById(id: string): Promise<Vacation> {
    const vacation = await this.vacationRepository.findOne({
      where: { id: id, deletedAt: null },
    });

    if (!vacation) {
      throw new HttpException(
        ERROR_MESSAGES.vacationNotFound,
        HttpStatus.NOT_FOUND,
      );
    }
    return vacation;
  }

  async createVacation(
    user: AuthUser,
    userId: string,
    vacationDto: CreateVacationDto,
  ): Promise<any> {
    try {
      const staff = await this.userRepository.findOne({
        where: { id: userId, deletedAt: null },
      });

      if (!staff) {
        throw new HttpException(
          ERROR_MESSAGES.userNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const { startDate, endDate, vacationType } = vacationDto;

      const startingDate = new Date(startDate);
      const endingDate = new Date(endDate);

      if (startDate > endDate) {
        throw new HttpException(
          ERROR_MESSAGES.datesConflict,
          HttpStatus.CONFLICT,
        );
      }

      if (user.id !== staff.createdBy) {
        throw new HttpException(ERROR_MESSAGES.forbidden, HttpStatus.FORBIDDEN);
      }

      const existingVacations = await this.vacationRepository.find({
        where: { vacationType, deletedAt: null },
      });

      const vacationNumber = existingVacations.length;

      const existingVacation = await this.vacationRepository.findOne({
        where: { userId: staff.id, vacationType, deletedAt: null },
        order: { availableDays: 'ASC' },
      });

      const timeDifferenceInMilliseconds =
        endingDate.getTime() - startingDate.getTime();
      const numberOfDays =
        timeDifferenceInMilliseconds / (24 * 60 * 60 * 1000) + 1;

      const requestedDays = Math.ceil(numberOfDays);

      if (existingVacation.availableDays < requestedDays) {
        throw new HttpException(
          ERROR_MESSAGES.insuficiendVacationDays,
          HttpStatus.BAD_REQUEST,
        );
      }
      const newVacation = new Vacation();
      newVacation.id;
      newVacation.userId = staff.id;
      newVacation.startDate = startingDate;
      newVacation.endDate = endingDate;
      newVacation.requestedDays = requestedDays;
      newVacation.vacationType = existingVacation.vacationType;
      newVacation.availableDays =
        existingVacation.availableDays - requestedDays;

      const vacationTypePrefixes = {
        [VacationType.SIMPLE_VACATION]: 'SiV',
        [VacationType.SICK_VACATION]: 'SkV',
        [VacationType.SPECIAL_VACATION]: 'SpV',
      };

      const prefix = vacationTypePrefixes[vacationType] || 'Unknown';

      newVacation.vacationIdentifier = `${prefix}${vacationNumber}`;

      const vacation = await this.vacationRepository.save(newVacation);
      return vacation;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateVacation(
    vacationId: string,
    vacationUpdate: UpdateVacationDto,
    response: any,
  ): Promise<any> {
    const vacation = await this.vacationRepository.findOne({
      where: {
        id: vacationId,
        deletedAt: null,
      },
    });

    if (!vacation) {
      throw new HttpException(
        ERROR_MESSAGES.vacationNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const newAvailableDays = vacation.availableDays + vacation.requestedDays;

    const { startDate, endDate, key } = vacationUpdate;

    const startingDate = new Date(startDate);
    const endingDate = new Date(endDate);

    const timeDifferenceInMilliseconds =
      endingDate.getTime() - startingDate.getTime();
    const numberOfDays = timeDifferenceInMilliseconds / (24 * 60 * 60 * 1000);

    const requestedDays = Math.ceil(numberOfDays);

    vacation.key = key;
    vacation.vacationStatus = VacationStatus.APPROVED;
    vacation.startDate = startingDate;
    vacation.endDate = endingDate;
    vacation.requestedDays = requestedDays;
    vacation.availableDays = newAvailableDays - requestedDays;

    const udpatedVacation = await this.vacationRepository.save(vacation);

    return response.status(HttpStatus.OK).json(udpatedVacation);
  }

  async updateVacationStatus(
    vacationId: string,
    updateVacationStatus: UpdateVacationStatusDto,
    response: any,
  ): Promise<any> {
    const vacation = await this.vacationRepository.findOne({
      where: {
        id: vacationId,
        deletedAt: null,
      },
    });
    if (!vacation) {
      throw new HttpException(
        ERROR_MESSAGES.vacationNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    Object.assign(vacation, updateVacationStatus);

    await this.vacationRepository.save(vacation);

    return response.status(HttpStatus.OK).json(vacation);
  }

  async deleteVacation(vacationId: string) {
    const vacation = await this.vacationRepository.findOne({
      where: { id: vacationId, deletedAt: null },
    });

    if (!vacation) {
      throw new HttpException(
        ERROR_MESSAGES.vacationNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.vacationRepository.softDelete(vacation.id);

    return { deleted: true };
  }
}
