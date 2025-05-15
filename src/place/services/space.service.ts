import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateSpaceDto } from '../dto/createSpace.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { Place } from '../entities/place.entity';
import { Repository } from 'typeorm';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Space } from '../entities/space.entity';
import { UpdateSpaceDto } from '../dto/updateSpace.dto';
import { getPaginated } from '@src/common/pagination';

@Injectable()
export class SpaceService {
  private alias = 'space';

  constructor(
    @InjectRepository(Space)
    private spaceRepository: Repository<Space>,

    @InjectRepository(Place)
    private placeRepository: Repository<Place>,

    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
  ) {}

  async getAllSpaces(user: AuthUser, filter: IFilter): Promise<Space> {
    const { limit, skip, all } = filter;
    const columns = ['name', 'duration'];

    try {
      const queryBuilder = this.spaceRepository.createQueryBuilder(this.alias);

      queryBuilder
        .where('space.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('space.deleted_at IS NULL');

      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.alias,
        'created_at',
        filter,
      );
      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);

      queryBuilder.groupBy('space.id');

      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const spaces = await queryBuilder.getMany();
      const countSpaces = await queryBuilder.getCount();

      const result = getPaginated({
        data: spaces,
        count: countSpaces,
        skip,
        limit,
        all,
      });
      return prettify(result);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getSpaceById(spaceId: string, user: AuthUser): Promise<Space> {
    const space = await this.spaceRepository.findOneBy({
      id: spaceId,
      restaurantId: user.restaurantId,
      deletedAt: null,
    });

    if (!space) {
      throw new HttpException(
        ERROR_MESSAGES.spaceNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return space;
  }

  async createSpace(
    placeId: string,
    restaurantId: string,
    user: AuthUser,
    createPlaceDto: CreateSpaceDto,
  ): Promise<Space> {
    const { name, duration, height, width } = createPlaceDto;
    const place = await this.placeRepository.findOneBy({
      id: placeId,
      deletedAt: null,
    });
    if (user.id !== place.userId) {
      throw new HttpException(ERROR_MESSAGES.forbidden, HttpStatus.FORBIDDEN);
    }

    const mainEntity = await this.restaurantRepository.findOneBy({
      id: restaurantId,
      deletedAt: null,
    });

    if (!mainEntity) {
      throw new HttpException(
        ERROR_MESSAGES.placeNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const space = new Space();
    space.name = name;
    space.duration = duration;
    space.height = height;
    space.width = width;
    space.restaurantId = restaurantId;

    return await this.spaceRepository.save(space).then((res) => {
      return res;
    });
  }

  async updateSpace(
    user: AuthUser,
    placeId: string,
    restaurantId: string,
    spaceId: string,
    updateSpaceDto: UpdateSpaceDto,
  ): Promise<any> {
    try {
      const place = await this.placeRepository.findOneBy({
        id: placeId,
        deletedAt: null,
      });

      if (user.id !== place.userId) {
        throw new HttpException(ERROR_MESSAGES.forbidden, HttpStatus.FORBIDDEN);
      }

      const space = await this.spaceRepository.findOneBy({
        id: spaceId,
        deletedAt: null,
      });
      if (!space) {
        throw new HttpException(
          ERROR_MESSAGES.spaceNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const restaurant = await this.restaurantRepository.findOneBy({
        id: restaurantId,
        deletedAt: null,
      });

      if (restaurant.id !== space.restaurantId) {
        throw new HttpException(ERROR_MESSAGES.forbidden, HttpStatus.FORBIDDEN);
      }

      await this.spaceRepository.update(spaceId, updateSpaceDto);

      return { ...space, ...updateSpaceDto };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async deleteSpace(spaceId: string): Promise<any> {
    try {
      const space = await this.spaceRepository.findOne({
        where: { id: spaceId, deletedAt: null },
        relations: ['tables.reservations.orders', 'spaceItems'],
      });

      if (!space) {
        throw new HttpException(
          ERROR_MESSAGES.spaceNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.spaceRepository.softRemove(space);

      return { deleted: true };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteAllSpaces(restaurantId: string): Promise<any> {
    const spaces = await this.spaceRepository.find({
      where: {
        restaurant: { id: restaurantId },
        deletedAt: null,
      },
    });

    if (spaces.length > 0) {
      await this.spaceRepository.softRemove(spaces);
    }

    return { deleted: true };
  }
}
