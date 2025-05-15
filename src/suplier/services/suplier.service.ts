import * as dotenv from 'dotenv';
import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateSuplierDto } from '../dto/create_suplier.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Suplier } from '../entities/suplier.entity';
import { UpdateSuplierDto } from '../dto/update_suplier.dto';
import { getPaginated } from '@src/common/pagination';
import { plainToClass } from 'class-transformer';

dotenv.config();

@Injectable()
export class SuplierService {
  private alias = 'suplier';

  constructor(
    @InjectRepository(Suplier)
    private readonly suplierRepository: Repository<Suplier>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async create(user: AuthUser, createSuplierDto: CreateSuplierDto) {
    try {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: user.restaurantId, deletedAt: null },
      });

      if (!restaurant) {
        throw new HttpException(
          ERROR_MESSAGES.placeNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const suplier = plainToClass(Suplier, createSuplierDto);
      suplier.restaurantId = restaurant.id;

      const result = await this.suplierRepository.save(suplier);
      return result;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAll(filter: IFilter, user: AuthUser) {
    const { limit, skip, all } = filter;
    const columns = ['name'];
    try {
      const queryBuilder = this.suplierRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .where('suplier.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('suplier.deleted_at IS NULL')
        .orderBy('suplier.name', 'ASC');

      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.alias,
        'updated_at',
        filter,
      );

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);
      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const supliers = await queryBuilder.getMany();
      const countSupliers = await queryBuilder.getCount();

      const result = getPaginated({
        data: supliers,
        count: countSupliers,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getById(suplierId: string) {
    const suplier = await this.suplierRepository.findOne({
      where: { id: suplierId, deletedAt: null },
    });

    if (!suplier) {
      throw new HttpException(
        ERROR_MESSAGES.suplierNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return suplier;
  }

  async update(
    user: AuthUser,
    suplierId: string,
    updateSuplierDto: UpdateSuplierDto,
  ) {
    try {
      const suplier = await this.suplierRepository.findOne({
        where: { id: suplierId, deletedAt: null },
      });

      if (!suplier) {
        throw new HttpException(
          ERROR_MESSAGES.suplierNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (suplier.restaurantId !== user.restaurantId) {
        throw new HttpException(
          ERROR_MESSAGES.suplierCantBeUpdated,
          HttpStatus.BAD_REQUEST,
        );
      }

      const updatedSuplier = this.suplierRepository.create({
        ...suplier,
        ...updateSuplierDto,
      });

      await this.suplierRepository.save(updatedSuplier);

      return updatedSuplier;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(suplierId: string) {
    const supplier = await this.suplierRepository.findOne({
      where: {
        id: suplierId,
        deletedAt: null,
      },
    });

    if (!supplier) {
      throw new HttpException(
        ERROR_MESSAGES.suplierNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.suplierRepository.softDelete(suplierId);

    return { deleted: true };
  }
}
