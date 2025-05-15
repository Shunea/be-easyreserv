import { Injectable } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import calculateRestaurantRating from '@src/common/calculateRestaurantRating';
import { Reservation } from '@src/reservation/entities/reservation.entity';
import { ReservationStatus } from '@src/reservation/enums/reservationStatus.enum';

@Injectable()
export class MobileStatisticsService extends StatisticsService {
  async mobileHomePage(user: AuthUser) {
    const restaurant = await this.getRestaurant(user);
    const place = await this.getPlace(user);

    this.checkPlaceOwnership(place, restaurant);

    const spaceIds = restaurant.spaces.map((space) => space.id);
    const tables = await this.getTables(spaceIds);
    const allReservations = await this.getReservations(user.restaurantId);
    const allClosedReservations = await this.getClosedReservations(
      user.restaurantId,
    );
    const todayReservations = this.getTodayReservations(allReservations);
    const placeRating = calculateRestaurantRating(restaurant.reviews);
    const overallRevenue = this.calculateOverallRevenue(allClosedReservations);
    const tablesStatus = await this.getTablesStatus(spaceIds, tables.length);
    const reservationsTypes = this.getTodayReservationsTypes(todayReservations);

    return {
      overallRevenue: overallRevenue,
      reservationsTypes: reservationsTypes,
      dipsonibilityRate: tablesStatus,
      placeRating: placeRating,
    };
  }

  async mobileMainReportsPage(user: AuthUser) {
    const restaurant = await this.getRestaurant(user);
    const place = await this.getPlace(user);

    this.checkPlaceOwnership(place, restaurant);

    const allReservations = await this.getReservations(user.restaurantId);
    const allClosedReservations = await this.getClosedReservations(
      user.restaurantId,
    );

    const reservationsTypes = this.getAllTimeReservationsTypes(allReservations);
    const clientTypes = this.getClientsType(allClosedReservations);

    return {
      reservationsTypes: reservationsTypes,
      clientTypes: {
        uniqe: clientTypes.uniqueClients.size,
        recurrent: clientTypes.recurrentClients.size,
      },
    };
  }

  async getTablesStatus(spaceIds: string[], tableNumber: number) {
    const currentTime = new Date();

    const reservedTables = await this.tableRepository
      .createQueryBuilder('table')
      .leftJoin(
        'table.reservations',
        'reservation',
        'reservation.deleted_at IS NULL',
      )
      .where('table.spaceId IN (:...spaceIds)', {
        spaceIds: [null, ...spaceIds],
      })
      .andWhere(
        'reservation.startTime <= :currentTime AND reservation.endTime >= :currentTime',
        { currentTime },
      )
      .andWhere('table.deleted_at IS NULL')
      .getMany();

    const occupiedTables = reservedTables.length;

    return {
      occupied: occupiedTables,
      free: tableNumber - occupiedTables,
    };
  }

  getAllTimeReservationsTypes(reservations: Reservation[]) {
    const cancelledReservations = reservations.filter(
      (res) => res.status === ReservationStatus.CANCELLED,
    ).length;

    const dishonoredReservations = reservations.filter(
      (res) => res.status === ReservationStatus.DISHONORED,
    ).length;

    return {
      cancelled: cancelledReservations,
      dishonored: dishonoredReservations,
    };
  }

  getTodayReservationsTypes(reservations: Reservation[]) {
    const confirmedReservations = reservations.filter(
      (reservation) =>
        reservation.status === ReservationStatus.CONFIRMED ||
        reservation.status === ReservationStatus.CONFIRMED_PREORDER,
    ).length;

    const pendingReservations = reservations.filter(
      (reservation) =>
        reservation.status === ReservationStatus.PENDING ||
        reservation.status === ReservationStatus.PENDING_PREORDER,
    ).length;

    const servedReservations = reservations.filter(
      (reservation) =>
        reservation.status === ReservationStatus.SERVE ||
        reservation.status === ReservationStatus.SERVE_PREORDER,
    ).length;

    return {
      confirmed: confirmedReservations,
      pending: pendingReservations,
      served: servedReservations,
    };
  }

  async getReservations(restaurantId: string) {
    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('reservation.deleted_at IS NULL')
      .getMany();

    return reservations;
  }

  getClientsType(reservations: Reservation[]) {
    const uniqueClientsSet = new Set<string>();
    const recurrentClientsSet = new Set<string>();

    reservations.map((res) => {
      const userId = res.userId;

      if (!uniqueClientsSet.has(userId) && !recurrentClientsSet.has(userId)) {
        uniqueClientsSet.add(userId);
      } else {
        uniqueClientsSet.delete(userId);
        recurrentClientsSet.add(userId);
      }
    });

    return {
      uniqueClients: uniqueClientsSet,
      recurrentClients: recurrentClientsSet,
    };
  }
}
