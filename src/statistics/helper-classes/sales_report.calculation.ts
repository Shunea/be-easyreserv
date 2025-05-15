import { Reservation } from '@src/reservation/entities/reservation.entity';
import { BaseReportService } from './base_report.class';
import { FilterParam } from '../enums/filter.enum';
import * as moment from 'moment';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_MESSAGES } from '@src/constants';

export class SalesStatsService extends BaseReportService {
  calculateStatsForDate(reservations: Reservation[]) {
    const stats = {
      total: 0,
    };

    if (!reservations) {
      throw new HttpException(
        ERROR_MESSAGES.reservationNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    reservations.forEach((reservation) => {
      const totalPrice = reservation.orders.reduce(
        (acc, order) => acc + +order.price,
        0,
      );

      stats.total = totalPrice;
    });

    return stats;
  }

  getReports(startDate: Date, endDate: Date, filterParam: FilterParam) {
    const salesTotalsPerSpace = {};
    const salesForTimePerSpace = {};
    const salesTotalsForRestaurant = {};

    const groupedReservations = this.groupReservationsBySpace();

    filterParam = Object.values(FilterParam).includes(filterParam)
      ? filterParam
      : FilterParam.DAY;
    const startTime = startDate
      ? moment(startDate).startOf(filterParam)
      : moment().startOf(filterParam);
    const endTime = endDate
      ? moment(endDate).endOf(filterParam)
      : moment().endOf(filterParam);

    if (!startTime.isSameOrBefore(endTime)) {
      return null;
    }

    while (startTime.isSameOrBefore(endTime, filterParam)) {
      const formattedDate = startTime.format('YYYY-MM-DD');

      for (const spaceId in groupedReservations) {
        const spaceReservations = groupedReservations[spaceId];
        const filteredReservations = this.filterReservations(
          spaceReservations,
          startTime,
          filterParam,
        );
        const stats = this.calculateStatsForDate(filteredReservations);

        salesForTimePerSpace[spaceId] = salesForTimePerSpace[spaceId] || {};
        salesForTimePerSpace[spaceId][formattedDate] = stats;

        salesTotalsPerSpace[spaceId] = salesTotalsPerSpace[spaceId] || {
          total: 0,
        };

        salesTotalsPerSpace[spaceId].total += stats.total;
      }

      const filteredReservations = this.filterReservations(
        this.data,
        startTime,
        filterParam,
      );
      const stats = this.calculateStatsForDate(filteredReservations);
      salesTotalsForRestaurant[formattedDate] = stats;

      startTime.add(1, filterParam);
    }

    return {
      salesForTimePerSpace,
      salesTotalsPerSpace,
      salesTotalsForRestaurant,
    };
  }
}
