import { Reservation } from '@src/reservation/entities/reservation.entity';
import { FilterParam } from '../enums/filter.enum';
import * as moment from 'moment';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_MESSAGES } from '@src/constants';

export class BaseReportService {
  data: Reservation[];

  constructor(data: Reservation[]) {
    this.data = data || [];
  }

  groupReservationsBySpace() {
    const grouped = {};

    if (!this.data) {
      throw new HttpException(
        ERROR_MESSAGES.reservationNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    this.data.forEach((reservation) => {
      (reservation.tables || []).forEach((table) => {
        const spaceId = table.spaceId;
        if (!grouped[spaceId]) {
          grouped[spaceId] = [];
        }
        grouped[spaceId].push(reservation);
      });
    });
    return grouped;
  }

  filterReservations(
    reservations: Reservation[],
    date: any,
    filterParam: FilterParam,
  ) {
    if (!reservations) {
      throw new HttpException(
        ERROR_MESSAGES.reservationNotFound,
        HttpStatus.NOT_FOUND,
      );
    }
    return reservations.filter((reservation) => {
      const reservationStart = moment(reservation.startTime, 'YYYY-MM-DD');
      return reservationStart.isSame(date, filterParam);
    });
  }
}
