import * as dotenv from 'dotenv';
import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateRestaurantDto } from '../dto/createRestaurant.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { GetCoordinates } from '@src/common/geolocation/getCoordinatesByAddress';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { LocationParameters } from '@src/common/geolocation/locationInterface';
import { Place } from '@src/place/entities/place.entity';
import { PlanHistoryService } from '@src/plan/services/planHistory.service';
import { Repository } from 'typeorm';
import { ReservationStatus } from '@src/reservation/enums/reservationStatus.enum';
import { Restaurant } from '../entities/restaurant.entity';
import { Space } from '@src/place/entities/space.entity';
import { Table } from '@src/table/entities/table.entity';
import { UpdateRestaurantDto } from '../dto/updateRestaurant.dto';
import { User } from '@src/user/entities/user.entity';
import { getPaginated } from '@src/common/pagination';
import { Reservation } from '@src/reservation/entities/reservation.entity';

dotenv.config();

@Injectable()
export class RestaurantService {
  private alias = 'restaurant';
  private placeAlias = 'place';

  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,

    @InjectRepository(Place)
    private placeRepository: Repository<Place>,

    @InjectRepository(Space)
    private spaceRepository: Repository<Space>,

    @InjectRepository(Table)
    private tableRepository: Repository<Table>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly geoService: GetCoordinates,
    private readonly planHistoryService: PlanHistoryService,
  ) {}

  async getAll(filter: IFilter, user: AuthUser): Promise<Restaurant[]> {
    try {
      const { limit, skip, all, sortBy } = filter;
      const columns = ['name'];
      const overallRatingValues = filter?.filter?.overallRating;
      delete filter?.filter?.overallRating;

      const queryBuilder = this.restaurantRepository
        .createQueryBuilder(this.alias)
        .leftJoin(
          'restaurant.reviews',
          'reviews',
          'reviews.deleted_at IS NULL AND reviews.is_client_review = true AND reviews.restaurant_id = restaurant.id',
        )
        .select([
          'restaurant.id as id',
          'restaurant.created_at as createdAt',
          'restaurant.updated_at as updatedAt',
          'restaurant.deleted_at as deletedAt',
          'restaurant.name as name',
          'restaurant.email as email',
          'restaurant.phone_number as phoneNumber',
          'restaurant.image as image',
          'restaurant.image_galery as imageGalery',
          'restaurant.cuisine_type as cuisineType',
          'restaurant.work_schedule as workSchedule',
          'restaurant.latitude as latitude',
          'restaurant.longitude as longitude',
          'restaurant.address as address',
          'restaurant.sector as sector',
          'restaurant.city as city',
          'restaurant.place_id as placeId',
          'COUNT(DISTINCT reviews.id) as numberOfReviews',
          `COALESCE(
            ROUND(
              SUM(CASE WHEN reviews.is_client_review = true THEN reviews.food_rating + reviews.service_rating + reviews.price_rating + reviews.ambience_rating ELSE 0 END)
              / NULLIF(SUM(CASE WHEN reviews.is_client_review = true THEN 1 ELSE 0 END) * 4, 0), 2
            ), 0
          ) as overallRating`,
        ]);

      if (user) {
        queryBuilder
          .leftJoin(
            'restaurant.reservations',
            'reservations',
            `reservations.deleted_at IS NULL AND reservations.restaurant_id = restaurant.id AND reservations.status = "CLOSED" AND reservations.user_id = '${user.id}'`,
          )
          .leftJoin(
            'restaurant.favorites',
            'favorites',
            `favorites.deleted_at IS NULL AND favorites.restaurant_id = restaurant.id AND favorites.user_id = '${user.id}'`,
          )
          .addSelect('favorites.id as favoriteId')
          .addSelect(
            '(CASE WHEN favorites.id IS NOT NULL THEN true ELSE false END) as isFavorite',
          )
          .addSelect('COUNT(DISTINCT reservations.id) as numberOfReservations');
      }

      queryBuilder
        .where('restaurant.deleted_at IS NULL')
        .andWhere('restaurant.is_hidden = false')
        .groupBy('restaurant.id');

      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.alias,
        'updated_at',
        filter,
      );

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);
      FilterUtils.applyPagination(queryBuilder, 'getRawMany', filter);

      if (sortBy) {
        const [column] = Object.entries(sortBy)[0];

        if (columns.includes(column)) {
          FilterUtils.applySorting(queryBuilder, this.alias, filter);
        } else {
          FilterUtils.applySorting(queryBuilder, null, filter);
        }
      } else {
        queryBuilder.orderBy('restaurant.created_at', 'DESC');
      }

      if (
        overallRatingValues?.every((element) => typeof element === 'number')
      ) {
        const [minRating, maxRating] = overallRatingValues.flat().map(Number);

        const subquery = this.restaurantRepository
          .createQueryBuilder('subquery')
          .select('subquery.id')
          .leftJoin(
            'subquery.reviews',
            'subquery_reviews',
            'subquery_reviews.is_client_review = true AND subquery_reviews.deleted_at IS NULL',
          )
          .groupBy('subquery.id')
          .having(
            `COALESCE(
              ROUND(
                SUM(
                  CASE WHEN subquery_reviews.is_client_review = true THEN
                    subquery_reviews.food_rating +
                    subquery_reviews.service_rating +
                    subquery_reviews.price_rating +
                    subquery_reviews.ambience_rating
                  ELSE
                    0
                  END
                ) / NULLIF(SUM(CASE WHEN subquery_reviews.is_client_review = true THEN 1 ELSE 0 END) * 4, 0), 2
              ), 0
            ) BETWEEN :minRating AND :maxRating`,
          )
          .getSql();

        queryBuilder.andWhere(`restaurant.id IN (${subquery})`, {
          minRating,
          maxRating,
        });
      }

      const restaurantsCount = await queryBuilder.getCount();
      const restaurants = await queryBuilder.getRawMany();

      for (const restaurant of restaurants) {
        if (user) {
          restaurant.isFavorite = !!restaurant.isFavorite;
          restaurant.numberOfReservations = +restaurant.numberOfReservations;
        }
        restaurant.workSchedule = JSON.parse(restaurant.workSchedule);
        restaurant.numberOfReviews = +restaurant.numberOfReviews;
        restaurant.overallRating = +restaurant.overallRating;
        restaurant.image = restaurant.image
          ? `${process.env.AWS_STATIC_URL}/images/${restaurant.image}`
          : null;
        restaurant.imageGalery = restaurant.imageGalery
          ? JSON.parse(restaurant.imageGalery).map(
              (image) => `${process.env.AWS_STATIC_URL}/images/${image}`,
            )
          : null;
      }

      const result = getPaginated({
        data: restaurants,
        count: restaurantsCount,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllSpacesByRestaurantId(restaurantId: string): Promise<Space[]> {
    const excludedStatuses = [
      ReservationStatus.CANCELLED,
      ReservationStatus.CLOSED,
      ReservationStatus.DISHONORED,
      ReservationStatus.REJECTED,
    ];

    try {
      const spaces = await this.spaceRepository
        .createQueryBuilder('space')
        .leftJoinAndSelect('space.tables', 'table', 'table.deleted_at IS NULL')
        .leftJoinAndSelect(
          'space.spaceItems',
          'spaceItems',
          'spaceItems.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'table.reservations',
          'reservation',
          '((reservation.startTime <= :currentTime AND (reservation.status = "SERVE" OR reservation.status = "SERVE_PREORDER")) OR ' +
            '(reservation.startTime <= :currentTime AND reservation.endTime >= :currentTime)) AND ' +
            'reservation.deleted_at IS NULL AND ' +
            'reservation.status NOT IN (:...excludedStatuses)',
          { currentTime: new Date(), excludedStatuses },
        )
        .where('space.restaurant_id = :restaurantId', { restaurantId })
        .andWhere('space.deleted_at IS NULL')
        .getMany();

      return spaces;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async checkTablesAvailability(
    restaurantId: string,
    date: Date,
    startTime: Date,
    endTime: Date,
  ) {
    try {
      const excludedStatuses = [
        ReservationStatus.CANCELLED,
        ReservationStatus.CLOSED,
        ReservationStatus.DISHONORED,
        ReservationStatus.REJECTED,
      ];

      const overlappingReservations = await this.tableRepository
        .createQueryBuilder('table')
        .leftJoinAndSelect(
          'table.reservations',
          'reservation',
          'reservation.deleted_at IS NULL',
        )
        .leftJoin('table.space', 'space', 'space.deleted_at IS NULL')
        .where('space.restaurant.id = :restaurantId', { restaurantId })
        .andWhere('table.deleted_at IS NULL')
        .andWhere('reservation.date = :date ', { date })
        .andWhere('reservation.deleted_at IS NULL')
        .andWhere('reservation.status NOT IN (:...statuses)', {
          statuses: excludedStatuses,
        })
        .andWhere(
          '((reservation.startTime <= :currentTime AND (reservation.status = "SERVE" OR reservation.status = "SERVE_PREORDER")) OR ' +
            '(reservation.startTime <= :endTime AND reservation.endTime >= :startTime))',
          { currentTime: new Date(), startTime, endTime },
        )
        .getMany();

      const spaceQuery = await this.spaceRepository
        .createQueryBuilder('space')
        .leftJoinAndSelect('space.tables', 'table', 'table.deleted_at IS NULL')
        .leftJoinAndSelect(
          'space.spaceItems',
          'space_items',
          'space_items.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'table.reservations',
          'reservation',
          'reservation.deleted_at IS NULL AND reservation.status NOT IN (:...statuses) AND ' +
            '((reservation.startTime <= :currentTime AND (reservation.status = "SERVE" OR reservation.status = "SERVE_PREORDER")) OR ' +
            '(reservation.startTime <= :endTime AND reservation.endTime >= :startTime))',
          {
            statuses: excludedStatuses,
            currentTime: new Date(),
            startTime,
            endTime,
          },
        )
        .where('space.restaurant.id = :restaurantId', { restaurantId })
        .andWhere('space.deleted_at IS NULL')
        .getMany();

      const totalTablesNumber = spaceQuery.reduce((acc, space) => {
        return acc + space.tables.length;
      }, 0);

      if (overlappingReservations.length < totalTablesNumber) {
        return {
          spaceQuery,
        };
      } else {
        throw new HttpException(
          ERROR_MESSAGES.noFreeTables,
          HttpStatus.NOT_FOUND,
        );
      }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getById(restaurantId: string): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(
        'restaurant.favorites',
        'favorites',
        'favorites.deleted_at IS NULL',
      )
      .where('restaurant.id = :restaurantId', { restaurantId })
      .andWhere('restaurant.deleted_at IS NULL')
      .getOne();

    if (!restaurant) {
      throw new HttpException(
        ERROR_MESSAGES.restaurantNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    if (restaurant.image) {
      restaurant.image = restaurant.image
        ? `${process.env.AWS_STATIC_URL}/images/${restaurant.image}`
        : null;
    }

    if (restaurant.imageGalery) {
      restaurant.imageGalery = restaurant.imageGalery
        ? JSON.parse(restaurant.imageGalery).map(
            (image) => `${process.env.AWS_STATIC_URL}/images/${image}`,
          )
        : null;
    }

    restaurant['isFavorite'] =
      restaurant.favorites && restaurant.favorites.length > 0;

    return restaurant;
  }

  async create(
    user: AuthUser,
    createRestaurantDto: CreateRestaurantDto,
    lat: number,
    lon: number,
  ) {
    try {
      const {
        name,
        email,
        phoneNumber,
        cuisineType,
        workSchedule,
        image,
        imageGalery,
        sector,
        planId,
        placeId,
        isHidden,
      } = createRestaurantDto;

      await this.checkExistingRestaurant(placeId, name, email, phoneNumber);

      const place = await this.placeRepository
        .createQueryBuilder(this.placeAlias)
        .where('place.id = :placeId', { placeId })
        .andWhere('place.user_id = :userId', { userId: user.id })
        .andWhere('place.deleted_at IS NULL')
        .getOne();

      if (!place) {
        throw new HttpException(
          ERROR_MESSAGES.placeNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      let addressData: LocationParameters;
      if (lat !== undefined && lon !== undefined) {
        addressData = await this.geoService.getAddressByCoordinates(lat, lon);
      }

      const restaurant = new Restaurant();
      restaurant.name = name;
      restaurant.email = email;
      restaurant.phoneNumber = phoneNumber;
      restaurant.cuisineType = cuisineType;
      restaurant.workSchedule = workSchedule;
      restaurant.latitude = lat;
      restaurant.longitude = lon;
      restaurant.address = addressData.address;
      restaurant.city = addressData.city;
      restaurant.sector = sector;
      restaurant.placeId = placeId;
      restaurant.image = image;
      restaurant.imageGalery = JSON.stringify(imageGalery);
      restaurant.isHidden = !!isHidden;

      if (!restaurant.sector || !restaurant.address || !restaurant.city) {
        throw new HttpException(
          ERROR_MESSAGES.dataAboutLocation,
          HttpStatus.BAD_REQUEST,
        );
      }

      const createdRestaurant = await this.restaurantRepository.save(
        restaurant,
      );

      await this.createRestaurantPlanHistory(user, planId, createdRestaurant);

      return createdRestaurant;
    } catch (error) {
      if (createRestaurantDto?.placeId) {
        await this.placeRepository.delete(createRestaurantDto.placeId);
      }
      throw new HttpException(error.message, error.status);
    }
  }

  async findRestaurantInRadius(
    lat: number,
    lon: number,
    radius: number,
  ): Promise<Restaurant[]> {
    const restaurants = await this.restaurantRepository
      .createQueryBuilder(this.alias)
      .select([
        'restaurant.name as name',
        'restaurant.email as email',
        'restaurant.phone_number as phoneNumber',
        'restaurant.image as image',
        'restaurant.cuisine_type as cuisineType',
        'restaurant.work_schedule as workSchedule',
        'restaurant.address as address',
      ])
      .addSelect(
        `
        ST_Distance_Sphere(
          POINT(${lon}, ${lat}),
          POINT(restaurant.longitude, restaurant.latitude)
        ) as distance
      `,
      )
      .where('restaurant.deleted_at IS NULL')
      .having('distance <= :radius', { radius })
      .orderBy('distance')
      .getRawMany();

    return restaurants;
  }

  async update(
    user: AuthUser,
    placeId: string,
    restaurantId: string,
    updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<any> {
    try {
      const { name, email, phoneNumber } = updateRestaurantDto;

      await this.checkExistingRestaurant(placeId, name, email, phoneNumber);

      const restaurant = await this.restaurantRepository.findOne({
        where: {
          id: restaurantId,
          deletedAt: null,
        },
      });

      if (!restaurant) {
        throw new HttpException(
          ERROR_MESSAGES.restaurantNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const place = await this.placeRepository.findOne({
        where: { id: placeId, deletedAt: null },
      });

      if (place.id !== placeId) {
        throw new HttpException(
          ERROR_MESSAGES.somethingWentWrong,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (restaurant.id !== user.restaurantId) {
        throw new HttpException(ERROR_MESSAGES.forbidden, HttpStatus.FORBIDDEN);
      }

      await this.restaurantRepository.update(restaurantId, updateRestaurantDto);

      return { ...restaurant, ...updateRestaurantDto };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getRestaurantField(field: string): Promise<any> {
    try {
      const allowedFields = ['sector', 'cuisine_type'];

      if (!allowedFields.includes(field)) {
        throw new HttpException(
          ERROR_MESSAGES.notAllowed,
          HttpStatus.METHOD_NOT_ALLOWED,
        );
      }

      const response = await this.spaceRepository.query(
        `SELECT ${field} FROM restaurant`,
      );

      const uniqueFields = [...new Set(response.map((item) => item[field]))];

      return uniqueFields;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getImageGallery(restaurantId: string): Promise<any> {
    try {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: restaurantId, deletedAt: null },
        select: ['id', 'imageGalery'],
      });

      const response = JSON.parse(restaurant.imageGalery);

      return response;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(placeId: string, restaurantId: string) {
    try {
      const restaurant = await this.restaurantRepository.findOne({
        where: {
          id: restaurantId,
          deletedAt: null,
        },
      });

      if (!restaurant) {
        throw new HttpException(
          ERROR_MESSAGES.restaurantNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const place = await this.placeRepository.findOne({
        where: { id: placeId, deletedAt: null },
      });

      if (!place) {
        throw new HttpException(
          ERROR_MESSAGES.placeNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (restaurant.placeId !== place.id) {
        throw new HttpException(
          ERROR_MESSAGES.somethingWentWrong,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.restaurantRepository.softRemove(restaurant);

      return { deleted: true };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  private async createRestaurantPlanHistory(
    user: AuthUser,
    planId: string,
    createdRestaurant: Restaurant,
  ) {
    const planHistory =
      await this.planHistoryService.getWithoutRestaurantByUserId(user.id);

    if (planHistory) {
      await this.planHistoryService.update(planHistory.id, {
        restaurantId: createdRestaurant.id,
      });
    } else {
      await this.planHistoryService.create(
        { planId, restaurantId: createdRestaurant.id },
        user,
      );
    }
  }

  private async checkExistingRestaurant(
    placeId: string,
    name?: string,
    email?: string,
    phoneNumber?: string,
  ) {
    if (!name && !email && !phoneNumber) {
      return;
    }

    let conditions = [
      name && 'restaurant.name = :name',
      email && 'restaurant.email = :email',
      phoneNumber && 'restaurant.phone_number = :phoneNumber',
    ]
      .filter(Boolean)
      .join(' OR ');

    conditions = `restaurant.deleted_at IS NULL AND ${
      conditions.includes('OR') ? `(${conditions})` : conditions
    }`;

    const parameters = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phoneNumber && { phoneNumber }),
    };

    const existingRestaurant = await this.restaurantRepository
      .createQueryBuilder(this.alias)
      .where(conditions)
      .setParameters(parameters)
      .getOne();

    if (existingRestaurant) {
      const isSameName = existingRestaurant.name === name;
      const isSameEmailAndDifferentPlace =
        existingRestaurant.email === email &&
        existingRestaurant.placeId !== placeId;
      const isSamePhoneAndDifferentPlace =
        existingRestaurant.phoneNumber === phoneNumber &&
        existingRestaurant.placeId !== placeId;

      if (isSameName) {
        throw new HttpException(
          ERROR_MESSAGES.restaurantNameAlreadyRegistered,
          HttpStatus.FOUND,
        );
      } else if (isSameEmailAndDifferentPlace) {
        throw new HttpException(
          ERROR_MESSAGES.restaurantEmailAlreadyRegistered,
          HttpStatus.FOUND,
        );
      } else if (isSamePhoneAndDifferentPlace) {
        throw new HttpException(
          ERROR_MESSAGES.restaurantPhoneAlreadyRegistered,
          HttpStatus.FOUND,
        );
      }
    }
  }
}
