import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommunicationTypes } from '../entities/communication_types.entity';
import { Repository } from 'typeorm';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateCommunicationTypesDto } from '../dto/create_communication_types.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { plainToClass } from 'class-transformer';
import { IFilter } from '@src/middlewares/QueryParser';
import { FilterUtils } from '@src/common/utils';
import { getPaginated } from '@src/common/pagination';
import prettify from '@src/common/prettify';

@Injectable()
export class CommunicationTypesService {
  private alias = 'communication_types';
  constructor(
    @InjectRepository(CommunicationTypes)
    private communicationTypesRepository: Repository<CommunicationTypes>,
  ) {}

  async create(
    user: AuthUser,
    createCommunicationTypesDto: CreateCommunicationTypesDto,
  ) {
    const existingType = await this.communicationTypesRepository.findOne({
      where: {
        restaurantId: user.restaurantId,
        type: createCommunicationTypesDto.type,
        deletedAt: null,
      },
    });

    if (existingType) {
      throw new HttpException(
        ERROR_MESSAGES.typeAlreadyExists,
        HttpStatus.BAD_REQUEST,
      );
    }

    const newType = this.communicationTypesRepository.create({
      ...createCommunicationTypesDto,
      restaurantId: user.restaurantId,
    });

    await this.communicationTypesRepository.save(newType);

    return newType;
  }

  async getAll(user: AuthUser, filter: IFilter) {
    const { limit, skip, all } = filter;
    try {
      const queryBuilder = this.communicationTypesRepository
        .createQueryBuilder(this.alias)
        .where('communication_types.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('communication_types.deleted_at IS NULL');

      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.alias,
        'updated_at',
        filter,
      );
      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const types = await queryBuilder.getMany();
      const countTypes = await queryBuilder.getCount();

      const result = getPaginated({
        data: types,
        count: countTypes,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
