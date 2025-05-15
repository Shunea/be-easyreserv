import * as dotenv from 'dotenv';
import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateFavoriteDto } from '../dto/createFavorite.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { Favorite } from '../entities/favorite.entity';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateFavoriteDto } from '../dto/updateFavorite.dto';
import { getPaginated } from '@src/common/pagination';
import { plainToClass } from 'class-transformer';

dotenv.config();

@Injectable()
export class FavoriteService {
  private alias = 'favorite';

  constructor(
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
  ) {}

  async create(body: CreateFavoriteDto, user: AuthUser): Promise<Favorite> {
    try {
      body.userId = body.userId || user.id;

      const favorite = plainToClass(Favorite, body);

      return await this.favoriteRepository.save(favorite).then((res) => {
        return res;
      });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getAll(user: AuthUser, filter: IFilter): Promise<Favorite[]> {
    const { limit, skip, all } = filter;
    const columns = ['restaurant.name'];

    try {
      const queryBuilder = this.favoriteRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .select([
          'favorite.id as favoriteId',
          'favorite.created_at as createdAt',
          'favorite.updated_at as updatedAt',
          'favorite.deleted_at as deletedAt',
          'favorite.user_id as userId',
          'favorite.restaurant_id as restaurantId',
          'restaurant.*',
          'COUNT(DISTINCT reviews.id) as numberOfReviews',
          `COALESCE(
            ROUND(
              SUM(CASE WHEN reviews.is_client_review = true THEN reviews.food_rating + reviews.service_rating + reviews.price_rating + reviews.ambience_rating ELSE 0 END)
              / NULLIF(SUM(CASE WHEN reviews.is_client_review = true THEN 1 ELSE 0 END) * 4, 0), 2
            ), 0
          ) as overallRating`,
        ])
        .leftJoin(
          'favorite.restaurant',
          'restaurant',
          'favorite.restaurant_id = restaurant.id AND restaurant.deleted_at IS NULL',
        )
        .leftJoin(
          'restaurant.reviews',
          'reviews',
          'restaurant.id = reviews.restaurant_id AND reviews.is_client_review = true AND reviews.deleted_at IS NULL',
        )
        .where('favorite.user_id = :userId', { userId: user.id })
        .andWhere('favorite.deleted_at IS NULL');

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);

      queryBuilder.groupBy('favorite.id').orderBy('favorite.createdAt', 'DESC');

      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getRawMany', filter);

      const favoritesCount = await queryBuilder.getCount();
      const favorites = (await queryBuilder.getRawMany())
        .filter((row) => !row.is_hidden)
        .map((row) => ({
          id: row.favoriteId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          deletedAt: row.deletedAt,
          userId: row.userId,
          restaurantId: row.restaurantId,
          restaurant: {
            id: row.restaurantId,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            name: row.name,
            email: row.email,
            phoneNumber: row.phone_number,
            image: row.image,
            imageGalery: (row.image_galery = row.image_galery
              ? JSON.parse(row.image_galery).map(
                  (image) => `${process.env.AWS_STATIC_URL}/images/${image}`,
                )
              : null),
            cuisineType: row.cuisine_type,
            workSchedule: JSON.parse(row.work_schedule),
            latitude: row.latitude,
            longitude: row.longitude,
            address: row.address,
            sector: row.sector,
            city: row.city,
            placeId: row.place_id,
            numberOfReviews: +row.numberOfReviews,
            overallRating: +row.overallRating,
            isHidden: row.is_hidden,
          },
        }));

      const result = getPaginated({
        data: favorites,
        count: favoritesCount,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getById(favoriteId: string, response: any): Promise<Favorite> {
    const favorite = await this.favoriteRepository.findOneBy({
      id: favoriteId,
      deletedAt: null,
    });

    if (!favorite) {
      throw new HttpException(
        ERROR_MESSAGES.favoriteNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return response.status(HttpStatus.OK).json(favorite);
  }

  async update(
    favoriteId: string,
    updateFavoriteDto: UpdateFavoriteDto,
    response: any,
  ): Promise<any> {
    const favorite = await this.favoriteRepository.findOneBy({
      id: favoriteId,
      deletedAt: null,
    });

    if (!favorite) {
      throw new HttpException(
        ERROR_MESSAGES.favoriteNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.favoriteRepository.update(favoriteId, updateFavoriteDto);

    const updatedFavorite = await this.favoriteRepository.findOne({
      where: { id: favoriteId, deletedAt: null },
    });

    return response.status(HttpStatus.OK).json(updatedFavorite);
  }

  async delete(favoriteId: string, response: any) {
    const favorite = await this.favoriteRepository.findOneBy({
      id: favoriteId,
      deletedAt: null,
    });

    if (!favorite) {
      throw new HttpException(
        ERROR_MESSAGES.favoriteNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.favoriteRepository.softDelete(favoriteId);

    return response.status(HttpStatus.OK).json({ deleted: true });
  }
}
