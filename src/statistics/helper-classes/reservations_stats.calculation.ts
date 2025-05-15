import { Reservation } from '@src/reservation/entities/reservation.entity';
import { BaseReportService } from './base_report.class';
import { ReservationStatus } from '@src/reservation/enums/reservationStatus.enum';
import { FilterParam } from '../enums/filter.enum';
import * as moment from 'moment';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_MESSAGES } from '@src/constants';

export class ReservationStatsService extends BaseReportService {
  calculateStatsForDate(reservations: Reservation[]) {
    const stats = {
      total: 0,
      missed: 0,
      canceled: 0,
      closed: 0,
    };

    if (!reservations) {
      throw new HttpException(
        ERROR_MESSAGES.reservationNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    reservations.forEach((reservation) => {
      stats.total++;
      if (reservation.status === ReservationStatus.DISHONORED) {
        stats.missed++;
      } else if (reservation.status === ReservationStatus.CANCELLED) {
        stats.canceled++;
      } else if (reservation.status === ReservationStatus.CLOSED) {
        stats.closed++;
      }
    });

    return stats;
  }

  getReports(startDate: Date, endDate: Date, filterParam: FilterParam) {
    const reservationsStatsPerSpace = {};
    const reservationTotalsForSpace = {};
    const reservationsStatsForRestaurant = {};

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

        reservationsStatsPerSpace[spaceId] =
          reservationsStatsPerSpace[spaceId] || {};
        reservationsStatsPerSpace[spaceId][formattedDate] = stats;

        reservationTotalsForSpace[spaceId] = reservationTotalsForSpace[
          spaceId
        ] || {
          total: 0,
          missed: 0,
          canceled: 0,
          closed: 0,
        };

        reservationTotalsForSpace[spaceId].total += stats.total;
        reservationTotalsForSpace[spaceId].missed += stats.missed;
        reservationTotalsForSpace[spaceId].canceled += stats.canceled;
        reservationTotalsForSpace[spaceId].closed += stats.closed;
      }

      const filteredReservations = this.filterReservations(
        this.data,
        startTime,
        filterParam,
      );
      const stats = this.calculateStatsForDate(filteredReservations);
      reservationsStatsForRestaurant[formattedDate] = stats;

      startTime.add(1, filterParam);
    }

    return {
      reservationsStatsPerSpace,
      reservationTotalsForSpace,
      reservationsStatsForRestaurant,
    };
  }
}
