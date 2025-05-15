import { FilterParam } from '../enums/filter.enum';
import { Reservation } from '@src/reservation/entities/reservation.entity';
import { BaseReportService } from './base_report.class';
import * as moment from 'moment';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_MESSAGES } from '@src/constants';

export class ClientsStatsService extends BaseReportService {
  calculateStatsForDate(
    reservations: Reservation[],
    uniqueClientsSet: Set<any>,
    recurrentClientsSet: Set<any>,
  ) {
    const stats = {
      total: 0,
      unique: 0,
      recurrent: 0,
    };

    if (!reservations) {
      throw new HttpException(
        ERROR_MESSAGES.reservationNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    reservations.forEach((reservation) => {
      const clientId = reservation.userId;

      if (
        !uniqueClientsSet.has(clientId) &&
        !recurrentClientsSet.has(clientId)
      ) {
        stats.unique++;
        uniqueClientsSet.add(clientId);
      } else if (
        uniqueClientsSet.has(clientId) &&
        !recurrentClientsSet.has(clientId)
      ) {
        stats.recurrent++;
        recurrentClientsSet.add(clientId);
        uniqueClientsSet.delete(clientId);
      }
      stats.total = stats.unique + stats.recurrent;
    });

    return { uniqueClientsSet, recurrentClientsSet, stats };
  }

  getReports(startDate: Date, endDate: Date, filterParam: FilterParam) {
    const clientsStatusPerSpace = {};
    let clientsTotalsPerSpace = {};
    const clientsTotalsForRestaurant = {};
    const uniqueClientsSet = new Set();
    const recurrentClientsSet = new Set();
    const uniqueClientsSetForRestaurant = new Set();
    const recurrentClientsSetForRestaurant = new Set();

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
    let stats = null;

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

        stats = this.calculateStatsForDate(
          filteredReservations,
          uniqueClientsSet,
          recurrentClientsSet,
        );

        clientsStatusPerSpace[spaceId] = clientsStatusPerSpace[spaceId] || {};
        clientsStatusPerSpace[spaceId][formattedDate] = stats.stats;
      }

      const filteredReservations = this.filterReservations(
        this.data,
        startTime,
        filterParam,
      );
      const statsForRestaurantTotals = this.calculateStatsForDate(
        filteredReservations,
        uniqueClientsSetForRestaurant,
        recurrentClientsSetForRestaurant,
      );

      clientsTotalsForRestaurant[formattedDate] =
        statsForRestaurantTotals.stats;

      startTime.add(1, filterParam);
    }

    clientsTotalsPerSpace = clientsTotalsPerSpaceCalculation(
      clientsTotalsPerSpace,
      groupedReservations,
      stats,
    );

    return {
      clientsStatusPerSpace,
      clientsTotalsPerSpace,
      clientsTotalsForRestaurant,
    };
  }
}

function clientsTotalsPerSpaceCalculation(
  clientsTotalsTotalsPerSpace: any,
  reservations: any,
  stats: any,
) {
  for (const spaceId in reservations) {
    clientsTotalsTotalsPerSpace[spaceId] = clientsTotalsTotalsPerSpace[
      spaceId
    ] || {
      total: 0,
      unique: 0,
      recurrent: 0,
    };

    clientsTotalsTotalsPerSpace[spaceId].unique = stats.uniqueClientsSet.size;
    clientsTotalsTotalsPerSpace[spaceId].recurrent =
      stats.recurrentClientsSet.size;
    clientsTotalsTotalsPerSpace[spaceId].total =
      stats.uniqueClientsSet.size + stats.recurrentClientsSet.size;
  }

  return clientsTotalsTotalsPerSpace;
}
