import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { DashboardStatistics } from '../interfaces/statistics-dashboard.interface';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Place } from '@src/place/entities/place.entity';
import { Reservation } from '@src/reservation/entities/reservation.entity';
import { ReservationStatus } from '@src/reservation/enums/reservationStatus.enum';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Table } from '@src/table/entities/table.entity';
import { FilterParam } from '../enums/filter.enum';
import { ReservationStatsService } from '../helper-classes/reservations_stats.calculation';
import { ClientsStatsService } from '../helper-classes/clients_stats.calculation';
import { SalesStatsService } from '../helper-classes/sales_report.calculation';
import { RatingStatsService } from '../helper-classes/restaurant_ratings.calculation';
import calculateRestaurantRating from '@src/common/calculateRestaurantRating';
import * as moment from 'moment';
import { Product } from '@src/product/entities/product.entity';
import { ProductsStatsService } from '@src/statistics/helper-classes/products_stats.calculation';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Reservation)
    protected reservationRepository: Repository<Reservation>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
    @InjectRepository(Table)
    protected tableRepository: Repository<Table>,
    @InjectRepository(Product)
    protected productRepository: Repository<Product>,
  ) {}

  async getDashboardStatistics(user: AuthUser): Promise<DashboardStatistics> {
    try {
      const restaurant = await this.getRestaurant(user);
      const place = await this.getPlace(user);

      this.checkPlaceOwnership(place, restaurant);

      const spaceIds = restaurant.spaces.map((space) => space.id);
      const tables = await this.getTables(spaceIds);
      const occupancyRate = this.calculateOccupancyRate(tables);
      const placeRating = calculateRestaurantRating(restaurant.reviews);
      const reservations = await this.getClosedReservations(user.restaurantId);
      const todayReservations = this.getTodayReservations(reservations);
      const todayRevenue = this.calculateTodayRevenue(todayReservations);
      const overallRevenue = this.calculateOverallRevenue(reservations);
      const overallOrders = this.calculateOverallOrders(reservations);
      const averageCheck = this.calculateAverageCheck(
        overallRevenue,
        overallOrders,
      );
      const todayClients = this.getTodayClients(todayReservations);
      const totalProducts = await this.getAllProducts(user.restaurantId);
      const availableProducts = await this.getAvailableProducts(
        user.restaurantId,
      );

      const statistics = {
        occupancyRate: occupancyRate,
        placeRating: placeRating,
        todayRevenue: todayRevenue,
        averageCheck: averageCheck,
        todayReservations: todayReservations.length,
        todayClients: todayClients.size,
        totalProducts: totalProducts.length,
        availableProducts: availableProducts.length,
      };

      return statistics;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getMainPageReports(user: AuthUser) {
    const restaurant = await this.getRestaurant(user);
    const place = await this.getPlace(user);

    this.checkPlaceOwnership(place, restaurant);

    const spaceIds = restaurant.spaces.map((space) => space.id);
    const tables = await this.getTables(spaceIds);

    const allClosedReservations = await this.getClosedReservations(
      user.restaurantId,
    );
    const todayReservations = this.getTodayReservations(allClosedReservations);
    const getAllClients = this.getAllClients(allClosedReservations);
    const getTodayClients = this.getTodayClients(todayReservations);
    const todayRevenue = this.calculateTodayRevenue(todayReservations);
    const overallRevenue = this.calculateOverallRevenue(allClosedReservations);
    const placeRating = calculateRestaurantRating(restaurant.reviews);
    const totalReviews = restaurant.reviews.length;
    const occupancyRate = this.calculateOccupancyRate(tables);
    const tableStatusAtMoment = await this.getTablesStatusAtMoment(
      spaceIds,
      tables,
    );
    const popularTimes = await this.calculateDailyReservations(
      allClosedReservations,
    );

    const reports = {
      totalReservations: allClosedReservations.length,
      todayReservations: todayReservations.length,
      allClients: getAllClients.size,
      todayClients: getTodayClients.size,
      totalRevenue: overallRevenue,
      todayRevenue: todayRevenue,
      placeRating: placeRating,
      totalReviews: totalReviews,
      occupancyRate: occupancyRate,
      tableStatusAtMoment: tableStatusAtMoment,
      popularTimes: popularTimes,
    };

    return reports;
  }

  async getReservationsPageReports(
    user: AuthUser,
    startDate: Date,
    endDate: Date,
    filterParam: FilterParam,
  ): Promise<ReservationsReports> {
    try {
      const restaurant = await this.getRestaurant(user);
      const place = await this.getPlace(user);

      this.checkPlaceOwnership(place, restaurant);

      const allReservations = await this.getAllReservations(user.restaurantId);

      const reservationsStatsPerSpace = new ReservationStatsService(
        allReservations,
      );
      const report = reservationsStatsPerSpace.getReports(
        startDate,
        endDate,
        filterParam,
      );

      if (report === null) {
        throw new HttpException(
          ERROR_MESSAGES.invalidDateRange,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        getReservationsStatsPerSpace: report.reservationsStatsPerSpace,
        getReservationsTotalsPerSpace: report.reservationTotalsForSpace,
        getReservationForRestaurant: report.reservationsStatsForRestaurant,
      };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getClientsPageReports(
    user: AuthUser,
    startDate: Date,
    endDate: Date,
    filterParam: FilterParam,
  ): Promise<ClientsReports> {
    try {
      const restaurant = await this.getRestaurant(user);
      const place = await this.getPlace(user);

      this.checkPlaceOwnership(place, restaurant);

      const reservations = await this.getClosedReservations(user.restaurantId);

      const clientsStatusPerSpace = new ClientsStatsService(reservations);
      const reports = clientsStatusPerSpace.getReports(
        startDate,
        endDate,
        filterParam,
      );

      if (reports === null) {
        throw new HttpException(
          ERROR_MESSAGES.invalidDateRange,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        clientsStatusPerSpace: reports.clientsStatusPerSpace,
        clientsTotalsPerSpace: reports.clientsTotalsPerSpace,
        clientsTotalsForRestaurant: reports.clientsTotalsForRestaurant,
      };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getReviewsPageReports(
    user: AuthUser,
    startDate: Date,
    endDate: Date,
    filterParam: FilterParam,
  ): Promise<RestaurantRating> {
    try {
      const restaurant = await this.getRestaurant(user);
      const place = await this.getPlace(user);

      this.checkPlaceOwnership(place, restaurant);

      const reviewStats = new RatingStatsService();
      const reports = reviewStats.getReports(
        restaurant.reviews,
        startDate,
        endDate,
        filterParam,
      );

      if (reports === null) {
        throw new HttpException(
          ERROR_MESSAGES.invalidDateRange,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        restaurantReviewsRating: reports,
      };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getSalesPageReports(
    user: AuthUser,
    startDate: Date,
    endDate: Date,
    filterParam: FilterParam,
  ): Promise<SalesReport> {
    try {
      const restaurant = await this.getRestaurant(user);
      const place = await this.getPlace(user);

      this.checkPlaceOwnership(place, restaurant);

      const reservations = await this.getClosedReservations(user.restaurantId);

      const salesStatsPerSpace = new SalesStatsService(reservations);
      const report = salesStatsPerSpace.getReports(
        startDate,
        endDate,
        filterParam,
      );

      if (report === null) {
        throw new HttpException(
          ERROR_MESSAGES.invalidDateRange,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        salesForTimePerSpace: report.salesForTimePerSpace,
        salesTotalsPerSpace: report.salesTotalsPerSpace,
        salesTotalsForRestaurant: report.salesTotalsForRestaurant,
      };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getProductsPageReports(user: AuthUser): Promise<ProductsReports> {
    try {
      const restaurant = await this.getRestaurant(user);
      const place = await this.getPlace(user);

      this.checkPlaceOwnership(place, restaurant);

      const allProducts = await this.getAllProducts(user.restaurantId);

      const productsStatsPerRestaurant = new ProductsStatsService();
      const report = productsStatsPerRestaurant.getReports(allProducts);

      if (report === null) {
        throw new HttpException(
          ERROR_MESSAGES.invalidDateRange,
          HttpStatus.BAD_REQUEST,
        );
      }

      return {
        getProductsForRestaurant: report.productsStatsForRestaurant,
        getProductsDataForRestaurant: report.productsDataForRestaurant,
      };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  protected async getRestaurant(user: AuthUser): Promise<Restaurant> {
    const restaurant = await this.restaurantRepository
      .createQueryBuilder('restaurant')
      .leftJoinAndSelect(
        'restaurant.place',
        'place',
        'place.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'restaurant.reviews',
        'reviews',
        'reviews.is_client_review = true AND reviews.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'restaurant.spaces',
        'spaces',
        'spaces.deleted_at IS NULL',
      )
      .where('restaurant.id = :restaurantId', {
        restaurantId: user.restaurantId,
      })
      .andWhere('restaurant.deleted_at IS NULL')
      .getOne();

    if (!restaurant) {
      throw new HttpException(
        ERROR_MESSAGES.restaurantNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return restaurant;
  }

  protected async getPlace(user: AuthUser): Promise<Place> {
    return this.placeRepository.findOne({
      where: { id: user.placeId, deletedAt: null },
    });
  }

  protected async getTables(spaceIds: string[]): Promise<Table[]> {
    const tables = await this.tableRepository
      .createQueryBuilder('table')
      .leftJoinAndSelect(
        'table.reservations',
        'reservations',
        'reservations.deleted_at IS NULL',
      )
      .where('table.space_id IN (:...spaceIds)', {
        spaceIds: [null, ...spaceIds],
      })
      .andWhere('table.deleted_at IS NULL')
      .getMany();

    return tables;
  }

  async calculateDailyReservations(reservations: Reservation[]) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = moment(now).startOf('week').add(diffToMonday, 'days');
    const endOfWeek = moment(startOfWeek).add(7, 'days');

    const filteredReservations = reservations.filter((reservation) => {
      const startTime = moment(reservation.startTime, 'YYYY-MM-DD HH:mm:ss');
      const endTime = moment(reservation.endTime, 'YYYY-MM-DD HH:mm:ss');

      return (
        startTime.isSameOrAfter(startOfWeek, 'day') &&
        endTime.isSameOrBefore(endOfWeek, 'day')
      );
    });

    const dailyReservationCounts = new Array(7).fill(0);
    filteredReservations.forEach((reservation) => {
      const dayIndex = (reservation.startTime.getDay() + 6) % 7;
      dailyReservationCounts[dayIndex]++;
    });

    const maxReservations = Math.max(...dailyReservationCounts);

    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyReservations = weekdays.reduce((acc, weekday, index) => {
      const count = dailyReservationCounts[index];
      const percentage = Math.round((count / maxReservations) * 100);
      acc[weekday] = percentage;
      return acc;
    }, {});

    return dailyReservations;
  }

  private async getTablesStatusAtMoment(
    spaceIds: string[],
    tables: Table[],
  ): Promise<number> {
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

    const result = (reservedTables.length / tables.length) * 100;

    return result;
  }

  private calculateOccupancyRate(tables: Table[]): number {
    if (tables.length === 0) {
      return 0;
    }

    const tablesWithReservations = tables.filter(
      (table) => table.reservations.length > 0,
    );
    const occupiedTables = tablesWithReservations.filter((table) =>
      table.reservations.some(
        (reservation) =>
          reservation.deletedAt === null &&
          ((reservation.status === ReservationStatus.SERVE &&
            moment().isBetween(reservation.startTime, reservation.endTime)) ||
            (reservation.status === ReservationStatus.CLOSED &&
              moment().isSame(reservation.date, 'day'))),
      ),
    );

    const occupancyRate = (occupiedTables.length / tables.length) * 100;

    return Math.round(occupancyRate);
  }

  protected async getClosedReservations(
    restaurantId: string,
  ): Promise<Reservation[]> {
    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect(
        'reservation.tables',
        'tables',
        'tables.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'reservation.orders',
        'orders',
        'orders.deleted_at IS NULL',
      )
      .where('reservation.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('reservation.status = :status', {
        status: ReservationStatus.CLOSED,
      })
      .andWhere('reservation.deleted_at IS NULL')
      .getMany();

    return reservations;
  }

  private async getAllReservations(
    restaurantId: string,
  ): Promise<Reservation[]> {
    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect(
        'reservation.tables',
        'tables',
        'tables.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'reservation.orders',
        'orders',
        'orders.deleted_at IS NULL',
      )
      .where('reservation.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('reservation.deleted_at IS NULL')
      .getMany();

    return reservations;
  }

  protected getTodayReservations(reservations: Reservation[]): Reservation[] {
    return reservations.filter((reservation) =>
      moment(reservation.date, 'YYYY-MM-DD HH:mm:ss').isSame(moment(), 'day'),
    );
  }

  private calculateTodayRevenue(todayReservations: Reservation[]): number {
    return todayReservations.reduce((total, reservation) => {
      return (
        total +
        reservation.orders.reduce(
          (subtotal, order) => +subtotal + +order.price,
          0,
        )
      );
    }, 0);
  }

  protected calculateOverallRevenue(reservations: Reservation[]): number {
    return reservations.reduce((total, reservation) => {
      return (
        total +
        reservation.orders.reduce(
          (subtotal, order) => +subtotal + +order.price,
          0,
        )
      );
    }, 0);
  }

  private calculateOverallOrders(reservations: Reservation[]): number {
    return reservations.reduce(
      (total, reservation) => +total + reservation.orders.length,
      0,
    );
  }

  protected checkPlaceOwnership(place: Place, restaurant: Restaurant): void {
    if (!place || place.id !== restaurant.placeId) {
      throw new HttpException(ERROR_MESSAGES.forbidden, HttpStatus.FORBIDDEN);
    }
  }

  private calculateAverageCheck(
    overallRevenue: number,
    overallOrders: number,
  ): number {
    return overallOrders ? +(overallRevenue / overallOrders).toFixed(2) : 0;
  }

  private getTodayClients(todayReservations: Reservation[]): Set<string> {
    return new Set(todayReservations.map((reservation) => reservation.userId));
  }

  protected getAllClients(reservations: Reservation[]): Set<string> {
    return new Set(reservations.map((reservation) => reservation.userId));
  }

  protected async getAllProducts(restaurantId: string): Promise<Product[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('product.deleted_at IS NULL')
      .getMany();

    return products;
  }

  protected async getAvailableProducts(
    restaurantId: string,
  ): Promise<Product[]> {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('product.isAvailable IS TRUE')
      .andWhere('product.deleted_at IS NULL')
      .getMany();

    return products;
  }
}
