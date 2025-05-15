import * as dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';
import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreatePlaceDto } from '../dto/createPlace.dto';
import { DUMMY_ID, ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtPayload } from '@src/auth/interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { Place } from '../entities/place.entity';
import { RefreshToken } from '@src/refreshToken/entities/refreshToken.entity';
import { Repository } from 'typeorm';
import { User } from '@src/user/entities/user.entity';
import { getPaginated } from '@src/common/pagination';
import { getPlaceFieldMapping } from '@src/common/placeFieldMapping';
import { Role } from '@src/user/enums/roles.enum';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';

dotenv.config();

@Injectable()
export class PlaceService {
  private alias = 'place';

  constructor(
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,

    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,

    private readonly jwtService: JwtService,
  ) {}

  async getAllPlaces(user: AuthUser, filter: IFilter): Promise<Place> {
    const columns = ['place_type'];

    const { limit, skip, all } = filter;

    try {
      const queryBuilder = this.placeRepository.createQueryBuilder(this.alias);

      queryBuilder
        .where('place.user_id = :userId', { userId: user.id })
        .andWhere('place.deleted_at IS NULL');

      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.alias,
        'created_at',
        filter,
      );
      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);

      queryBuilder.groupBy('place.id').addGroupBy('place.place_type');

      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const places = await queryBuilder.getMany();
      const countPlaces = await queryBuilder.getCount();

      const result = getPaginated({
        data: places,
        count: countPlaces,
        skip,
        limit,
        all,
      });
      return prettify(result);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllAboutPlaces(user: AuthUser): Promise<any> {
    const places = await this.placeRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(
        'place.restaurants',
        'restaurants',
        'restaurants.deleted_at IS NULL',
      )
      .where('place.user_id = :userId', { userId: user.id })
      .andWhere('place.deleted_at IS NULL')
      .getMany();

    if (!places) {
      throw new HttpException(
        ERROR_MESSAGES.placeNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return places;
  }

  async getAllAboutPlaceById(placeId: string, user: AuthUser): Promise<any> {
    const places = await this.placeRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(
        'place.restaurants',
        'restaurants',
        'restaurants.deleted_at IS NULL',
      )
      .where('place.id = :placeId', { placeId })
      .andWhere('place.user_id = :userId', { userId: user.id })
      .andWhere('place.deleted_at IS NULL')
      .getMany();

    if (!places) {
      throw new HttpException(
        ERROR_MESSAGES.placeNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return places;
  }

  async getAllCurrentPlaces(user: AuthUser): Promise<any> {
    const userId =
      user.role !== Role.SUPER_ADMIN
        ? (
            await this.userRepository.findOne({
              where: { id: user.id, deletedAt: null },
            })
          ).createdBy
        : user.id;

    const places = await this.placeRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(
        'place.restaurants',
        'restaurants',
        'restaurants.deleted_at IS NULL',
      )
      .where('place.user_id = :userId', { userId })
      .andWhere('place.deleted_at IS NULL')
      .getMany();

    const currentPlaces = places.reduce((acc, place) => {
      return acc.concat(
        place.restaurants.map((restaurant) => ({
          id: restaurant.id,
          placeId: place.id,
          name: restaurant.name,
          address: restaurant.address,
          image: restaurant.image
            ? `${process.env.AWS_STATIC_URL}/images/${restaurant.image}`
            : null,
        })),
      );
    }, []);

    return currentPlaces;
  }

  async getPlaceById(placeId: string, user: AuthUser): Promise<Place> {
    const place = await this.placeRepository.findOneBy({
      id: placeId,
      userId: user.id,
      deletedAt: null,
    });

    if (!place) {
      throw new HttpException(
        ERROR_MESSAGES.placeNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return place;
  }

  async getPlaceByRestaurantId(
    restaurantId: string,
    user: AuthUser,
  ): Promise<Place> {
    const place = await this.placeRepository.findOneBy({
      id: restaurantId,
      userId: user.id,
      deletedAt: null,
    });

    if (!place) {
      throw new HttpException(
        ERROR_MESSAGES.placeNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return place;
  }

  async switchPlace(
    placeId: string,
    restaurantId: string,
    user: AuthUser,
    request: Request,
  ): Promise<any> {
    const userId =
      user.role !== Role.SUPER_ADMIN
        ? (
            await this.userRepository.findOne({
              where: { id: user.id, deletedAt: null },
            })
          ).createdBy
        : user.id;

    const place = await this.placeRepository.findOne({
      where: { id: placeId, userId, deletedAt: null },
    });

    if (!place) {
      throw new HttpException(
        ERROR_MESSAGES.placeNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId, placeId, deletedAt: null },
    });

    if (!restaurant) {
      throw new HttpException(
        ERROR_MESSAGES.restaurantNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.userRepository.update(user.id, { restaurantId, placeId });

    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { userId: user.id, deletedAt: null },
    });

    if (!refreshToken) {
      throw new HttpException(
        ERROR_MESSAGES.refreshTokenNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      restaurantId: restaurantId,
      placeId: placeId,
    };

    const expiresIn = this.calculateTokenExpiration(request);

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET_KEY,
      expiresIn,
    });

    return { accessToken };
  }

  async createPlace(
    user: AuthUser,
    createPlaceDto: CreatePlaceDto,
  ): Promise<Place> {
    const { placeType } = createPlaceDto;

    const place = new Place();
    place.placeType = placeType;
    place.userId = user.id;

    try {
      const newPlace = await this.placeRepository.save(place);
      const placeField = getPlaceFieldMapping(newPlace.placeType);

      await this.userRepository.update(user.id, {
        [placeField]: newPlace.id,
      });

      return newPlace;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(placeId: string, response: any) {
    try {
      const place = await this.placeRepository.findOne({
        where: { id: placeId, deletedAt: null },
        relations: [
          'restaurants.spaces.tables.reservations.orders',
          'restaurants.spaces.spaceItems',
          'restaurants.products.productIngredients',
        ],
      });

      if (!place) {
        throw new HttpException(
          ERROR_MESSAGES.placeNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.placeRepository.softRemove(place);

      return response.status(HttpStatus.OK).json({ deleted: true });
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  private calculateTokenExpiration(request: Request) {
    const authorization = request.headers['authorization'];
    const token = authorization
      ? authorization.split(' ')[1] || authorization
      : null;

    const decodedToken = jwt.decode(token);
    const expDate = new Date(decodedToken['exp'] * 1000);
    const currentDate = new Date();

    const diffInMilliseconds = expDate.getTime() - currentDate.getTime();
    const diffInMinutes = Math.abs(
      Math.floor(diffInMilliseconds / (1000 * 60)),
    );

    return `${diffInMinutes}m`;
  }
}
