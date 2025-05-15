import { HttpException, HttpStatus } from '@nestjs/common';
import { FilterParam } from '../enums/filter.enum';
import { Review } from '@src/review/entities/review.entity';
import * as moment from 'moment';
import { ERROR_MESSAGES } from '@src/constants';

export class RatingStatsService {
  filteredReviews(
    reviews: Review[],
    currentDate: any,
    filterParam: FilterParam,
  ) {
    if (!reviews) {
      throw new HttpException(
        ERROR_MESSAGES.reviewNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return reviews.filter((review) => {
      const reviewDate = moment(review.createdAt, 'YYYY-MM-DD');
      return reviewDate.isSame(currentDate, filterParam);
    });
  }

  calculateStatsForDate(filteredReviews: Review[]) {
    const stats = {
      totalRating: 0,
      foodRating: 0,
      serviceRating: 0,
      priceRating: 0,
      ambienceRating: 0,
    };

    const sumRatings = filteredReviews.reduce(
      (acc, review) => {
        acc.foodSum += review.foodRating / filteredReviews.length;
        acc.serviceSum += review.serviceRating / filteredReviews.length;
        acc.priceSum += review.priceRating / filteredReviews.length;
        acc.ambienceSum += review.ambienceRating / filteredReviews.length;
        return acc;
      },
      { foodSum: 0, serviceSum: 0, priceSum: 0, ambienceSum: 0 },
    );

    const { foodSum, serviceSum, priceSum, ambienceSum } = sumRatings;
    const totaRating = foodSum + serviceSum + priceSum + ambienceSum;

    stats.totalRating = +(totaRating / 4).toFixed(2);
    stats.foodRating = sumRatings.foodSum;
    stats.serviceRating = sumRatings.serviceSum;
    stats.priceRating = sumRatings.priceSum;
    stats.ambienceRating = sumRatings.ambienceSum;

    return stats;
  }

  getReports(
    reviews: Review[],
    startDate: Date,
    endDate: Date,
    filterParam: FilterParam,
  ) {
    const restaurantRatings = {};

    filterParam = Object.values(FilterParam).includes(filterParam)
      ? filterParam
      : FilterParam.DAY;
    const startTime = startDate
      ? moment(startDate).startOf(filterParam)
      : moment().startOf(filterParam);
    const endTime = endDate
      ? moment(endDate).endOf(filterParam)
      : moment().endOf(filterParam);

    if (!startTime.isBefore(endTime)) {
      return null;
    }

    while (startTime.isSameOrBefore(endTime, filterParam)) {
      const formattedDate = startTime.format('YYYY-MM-DD');

      const filteredReviews = this.filteredReviews(
        reviews,
        startTime,
        filterParam,
      );

      const stats = this.calculateStatsForDate(filteredReviews);
      restaurantRatings[formattedDate] = stats;

      startTime.add(1, filterParam);
    }

    return restaurantRatings;
  }
}
