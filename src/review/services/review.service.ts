import * as dotenv from 'dotenv';
import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateReviewDto } from '../dto/createReview.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { UpdateReviewDto } from '../dto/updateReview.dto';
import { getPaginated } from '@src/common/pagination';
import { plainToClass } from 'class-transformer';
import { Role } from '@src/user/enums/roles.enum';

dotenv.config();

@Injectable()
export class ReviewService {
  private alias = 'review';

  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async create(body: CreateReviewDto, user: AuthUser): Promise<Review> {
    try {
      const newReview = this.createReviewObject(body, user);
      const review = plainToClass(Review, newReview);

      return await this.reviewRepository.save(review);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getAll(user: AuthUser, filter: IFilter): Promise<Review[]> {
    const { limit, skip, all } = filter;
    const columns = ['message'];

    try {
      const queryBuilder = this.reviewRepository.createQueryBuilder(this.alias);

      queryBuilder
        .where('review.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('review.is_client_review = true')
        .andWhere('review.deleted_at IS NULL');

      if (user.role !== Role.SUPER_ADMIN) {
        queryBuilder.andWhere('review.user_id = :userId', { userId: user.id });
      }

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);

      const subQuery = queryBuilder.clone();
      const reviewsCount = await subQuery.getCount();

      const averageQuery = queryBuilder.clone();
      const averageResult = await averageQuery
        .select(
          `ROUND(
            SUM(
              CASE WHEN review.is_client_review = true THEN
                review.food_rating +
                review.service_rating +
                review.price_rating +
                review.ambience_rating
              ELSE
                0
              END
            ) / NULLIF(COUNT(DISTINCT CASE WHEN review.is_client_review = true THEN review.id END) * 4, 0), 2
          )`,
          'average',
        )
        .getRawOne();

      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const reviews = await queryBuilder.getMany();

      const result = getPaginated({
        data: reviews,
        count: reviewsCount,
        skip,
        limit,
        all,
      });

      const response = {
        ...result,
        average: averageResult ? +averageResult.average : 0,
      };

      return prettify(response);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllClientReviews(
    user: AuthUser,
    filter: IFilter,
  ): Promise<Review[]> {
    const { limit, skip, all } = filter;
    const columns = ['client.id', 'message'];

    try {
      const queryBuilder = this.reviewRepository.createQueryBuilder(this.alias);

      queryBuilder
        .leftJoinAndSelect(
          'review.reservation',
          'reservation',
          'reservation.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'reservation.user',
          'client',
          'client.deleted_at IS NULL',
        )
        .leftJoinAndSelect('review.user', 'staff', 'staff.deleted_at IS NULL')
        .select([
          'review.id as id',
          'review.created_at as createdAt',
          'review.message as message',
          'review.behavior_rating as behaviorRating',
          'review.communication_rating as communicationRating',
          'review.punctuality_rating as punctualityRating',
          'review.generosity_rating as generosityRating',
          'staff.id as staffId',
          'staff.username as staffName',
          'staff.avatar as staffAvatar',
          'client.id as clientId',
          'client.username as clientName',
          'client.avatar as clientAvatar',
          'client.phone_number as clientPhoneNumber',
          'client.email as clientEmail',
          'reservation.id as reservationId',
          `ROUND(
            (
              COALESCE(review.behavior_rating, 0) +
              COALESCE(review.communication_rating, 0) +
              COALESCE(review.punctuality_rating, 0) +
              COALESCE(review.generosity_rating, 0)
            ) / 
            NULLIF(
              (
                CASE WHEN review.behavior_rating IS NOT NULL THEN 1 ELSE 0 END +
                CASE WHEN review.communication_rating IS NOT NULL THEN 1 ELSE 0 END +
                CASE WHEN review.punctuality_rating IS NOT NULL THEN 1 ELSE 0 END +
                CASE WHEN review.generosity_rating IS NOT NULL THEN 1 ELSE 0 END
              ),
              0
            ), 2
          ) AS overallRating
          `,
        ])
        .where('review.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('review.is_staff_review = true')
        .andWhere('review.deleted_at IS NULL');

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);
      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getRawMany', filter);

      const reviews = await queryBuilder.getRawMany();
      const reviewsCount = await queryBuilder.getCount();

      for (const review of reviews) {
        review.clientAvatar = review.clientAvatar
          ? `${process.env.AWS_STATIC_URL}/images/${review.clientAvatar}`
          : null;
        review.staffAvatar = review.staffAvatar
          ? `${process.env.AWS_STATIC_URL}/images/${review.staffAvatar}`
          : null;
        review.overallRating = +review.overallRating;
      }

      const result = getPaginated({
        data: reviews,
        count: reviewsCount,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getById(reviewId: string, response: any): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: {
        id: reviewId,
        deletedAt: null,
      },
    });

    if (!review) {
      throw new HttpException(
        ERROR_MESSAGES.reviewNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return response.status(HttpStatus.OK).json(review);
  }

  async getAllByRestaurantId(
    restaurantId: string,
    filter: IFilter,
  ): Promise<Review> {
    const { limit, skip, all, sortBy } = filter;
    const columns = ['message'];
    const [sortColumn, sortOrder] = sortBy
      ? Object.entries(sortBy)[0]
      : [null, null];

    try {
      const queryBuilder = this.reviewRepository.createQueryBuilder(this.alias);

      queryBuilder
        .leftJoinAndSelect('review.user', 'user', 'user.deleted_at IS NULL')
        .where('review.restaurant_id = :restaurantId', { restaurantId })
        .andWhere('review.is_client_review = true')
        .andWhere('review.deleted_at IS NULL');

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);

      const subQuery = queryBuilder.clone();
      const reviewsCount = await subQuery.getCount();

      const overallRatingQuery = queryBuilder.clone();
      const overallRating = await overallRatingQuery
        .select(
          `ROUND(
            SUM(
              CASE WHEN review.is_client_review = true THEN
                review.food_rating +
                review.service_rating +
                review.price_rating +
                review.ambience_rating
              ELSE
                0
              END
            ) / NULLIF(COUNT(DISTINCT CASE WHEN review.is_client_review = true THEN review.id END) * 4, 0), 2
          )`,
          'rating',
        )
        .groupBy('review.restaurant_id')
        .getRawOne();

      if (sortColumn !== 'rating') {
        FilterUtils.applySorting(queryBuilder, this.alias, filter);
      }

      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const reviews = await queryBuilder.getMany();

      if (sortColumn === 'rating') {
        reviews.sort((a, b) => {
          const avgRatingA =
            (a.foodRating +
              a.serviceRating +
              a.priceRating +
              a.ambienceRating) /
            4;
          const avgRatingB =
            (b.foodRating +
              b.serviceRating +
              b.priceRating +
              b.ambienceRating) /
            4;

          if (sortOrder === 'DESC') {
            return avgRatingB - avgRatingA;
          } else {
            return avgRatingA - avgRatingB;
          }
        });
      }

      const result = getPaginated({
        data: reviews,
        count: reviewsCount,
        skip,
        limit,
        all,
      });

      const response = {
        ...result,
        overallRating: overallRating ? +overallRating.rating : 0,
      };

      return prettify(response);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllCategoryReviewsByRestaurantId(
    restaurantId: string,
    user: AuthUser,
    staff?: string,
  ): Promise<any> {
    try {
      const isStaffReview = !!(
        user &&
        user.role != Role.USER &&
        staff === 'true'
      );

      const selectFields = isStaffReview
        ? [
            'AVG(review.behavior_rating) AS behavior_rating',
            'AVG(review.communication_rating) AS communication_rating',
            'AVG(review.punctuality_rating) AS punctuality_rating',
            'AVG(review.generosity_rating) AS generosity_rating',
          ]
        : [
            'AVG(review.food_rating) AS food_rating',
            'AVG(review.service_rating) AS service_rating',
            'AVG(review.price_rating) AS price_rating',
            'AVG(review.ambience_rating) AS ambience_rating',
          ];

      const result = await this.reviewRepository
        .createQueryBuilder(this.alias)
        .where('review.restaurant_id = :restaurantId', { restaurantId })
        .andWhere('review.deleted_at IS NULL')
        .andWhere(
          isStaffReview
            ? 'review.is_staff_review = :isStaffReview'
            : 'review.is_client_review = :isClientReview',
          { isStaffReview, isClientReview: !isStaffReview },
        )
        .select(selectFields)
        .groupBy('review.restaurant_id')
        .getRawMany();

      return result.flatMap((row) => {
        const categories = [];
        if (!isStaffReview) {
          categories.push(
            {
              category: 'FOOD',
              rating: +parseFloat(row.food_rating).toFixed(2),
            },
            {
              category: 'SERVICE',
              rating: +parseFloat(row.service_rating).toFixed(2),
            },
            {
              category: 'PRICE',
              rating: +parseFloat(row.price_rating).toFixed(2),
            },
            {
              category: 'AMBIENCE',
              rating: +parseFloat(row.ambience_rating).toFixed(2),
            },
          );
        } else {
          categories.push(
            {
              category: 'BEHAVIOR',
              rating: +parseFloat(row.behavior_rating).toFixed(2),
            },
            {
              category: 'COMMUNICATION',
              rating: +parseFloat(row.communication_rating).toFixed(2),
            },
            {
              category: 'PUNCTUALITY',
              rating: +parseFloat(row.punctuality_rating).toFixed(2),
            },
            {
              category: 'GENEROSITY',
              rating: +parseFloat(row.generosity_rating).toFixed(2),
            },
          );
        }
        return categories;
      });
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getReviewByReservationId(reservationId: string): Promise<any> {
    try {
      const review = await this.reviewRepository
        .createQueryBuilder(this.alias)
        .leftJoinAndSelect('review.user', 'user', 'user.deleted_at IS NULL')
        .where('review.reservation_id = :reservationId', { reservationId })
        .andWhere('review.is_client_review = true')
        .andWhere('review.deleted_at IS NULL')
        .getOne();

      if (!review) {
        throw new HttpException(
          ERROR_MESSAGES.reviewNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      return review;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async update(
    reviewId: string,
    updateReviewDto: UpdateReviewDto,
    response: any,
  ): Promise<any> {
    const review = await this.reviewRepository.findOne({
      where: {
        id: reviewId,
        deletedAt: null,
      },
    });

    if (!review) {
      throw new HttpException(
        ERROR_MESSAGES.reviewNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.reviewRepository.update(reviewId, updateReviewDto);

    const updatedReview = await this.reviewRepository.findOneBy({
      id: reviewId,
      deletedAt: null,
    });

    return response.status(HttpStatus.OK).json(updatedReview);
  }

  async delete(reviewId: string, response: any) {
    const review = await this.reviewRepository.findOne({
      where: {
        id: reviewId,
        deletedAt: null,
      },
    });

    if (!review) {
      throw new HttpException(
        ERROR_MESSAGES.reviewNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.reviewRepository.softDelete(reviewId);

    return response.status(HttpStatus.OK).json({ deleted: true });
  }

  private createReviewObject(body: CreateReviewDto, user: AuthUser): Review {
    const newReview = new Review();
    newReview.userId = user.id;

    if (user.role === Role.USER) {
      this.populateUserReview(newReview, body);
    } else {
      this.populateStaffReview(newReview, body, user.restaurantId);
    }

    return newReview;
  }

  private populateUserReview(newReview: Review, body: CreateReviewDto): void {
    const {
      restaurantId,
      reservationId,
      message,
      foodRating,
      serviceRating,
      priceRating,
      ambienceRating,
    } = body;

    newReview.isClientReview = true;
    newReview.restaurantId = restaurantId;
    newReview.reservationId = reservationId;
    newReview.message = message;
    newReview.foodRating = foodRating;
    newReview.serviceRating = serviceRating;
    newReview.priceRating = priceRating;
    newReview.ambienceRating = ambienceRating;
  }

  private populateStaffReview(
    newReview: Review,
    body: CreateReviewDto,
    restaurantId: string,
  ): void {
    const {
      message,
      behaviorRating,
      reservationId,
      communicationRating,
      punctualityRating,
      generosityRating,
    } = body;

    newReview.isStaffReview = true;
    newReview.restaurantId = restaurantId;
    newReview.reservationId = reservationId;
    newReview.message = message;
    newReview.behaviorRating = behaviorRating;
    newReview.communicationRating = communicationRating;
    newReview.punctualityRating = punctualityRating;
    newReview.generosityRating = generosityRating;
  }
}
