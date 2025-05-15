import * as dotenv from 'dotenv';
import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateReservationDto } from '../dto/createReservation.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationService } from '@src/notification/services/notification.service';
import { Reservation } from '../entities/reservation.entity';
import { ReservationStatus } from '../enums/reservationStatus.enum';
import { Review } from '@src/review/entities/review.entity';
import { Role } from '@src/user/enums/roles.enum';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { Table } from '@src/table/entities/table.entity';
import { UpdateReservationDto } from '../dto/updateReservation.dto';
import { User } from '@src/user/entities/user.entity';
import { getPaginated } from '@src/common/pagination';
import { BonusService } from '@src/bonus/services/bonus.service';
import { OrderService } from './order.service';
import { Order } from '../entities/order.entity';
import { WaiterCodeService } from '@src/user/services/waiter-code.service';
dotenv.config();

@Injectable()
export class ReservationService {
  private alias = 'reservation';

  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly orderService: OrderService,
    private readonly notificationService: NotificationService,
    private readonly bonusService: BonusService,
    private readonly waiterCodeService: WaiterCodeService,
  ) {}

  private async validateWaiterAccess(waiterId: string | null, reservationId: string, user: AuthUser, waiterCode?: string): Promise<void> {
    if (!waiterId && !waiterCode) {
      return;
    }

    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId, deletedAt: null },
      relations: ['restaurant']
    });

    if (!reservation) {
      throw new HttpException(
        'Reservation not found',
        HttpStatus.NOT_FOUND
      );
    }

    // Verify the reservation belongs to the requesting user's restaurant
    if (reservation.restaurantId !== user.restaurantId) {
      throw new HttpException(
        'You are not authorized to access reservations from other restaurants',
        HttpStatus.FORBIDDEN
      );
    }

    // Allow access to unassigned reservations (waiterId is null)
    if (!reservation.waiterId) {
      return;
    }

    if (waiterCode) {
      const waiter = await this.userRepository
        .createQueryBuilder('user')
        .where('user.waiter_code = :waiterCode', { waiterCode })
        .andWhere('user.restaurant_id = :restaurantId', { restaurantId: user.restaurantId })
        .andWhere('user.deleted_at IS NULL')
        .getOne();

      if (!waiter) {
        throw new HttpException(
          'Invalid waiter code or unauthorized access',
          HttpStatus.FORBIDDEN
        );
      }

      // Check if this waiter is assigned to this reservation
      if (waiter.id !== reservation.waiterId) {
        throw new HttpException(
          'The code owner is not authorized to access this reservation',
          HttpStatus.FORBIDDEN
        );
      }

      return;
    }

    if (waiterId !== reservation.waiterId) {
      throw new HttpException(
        'You are not authorized to access this reservation',
        HttpStatus.FORBIDDEN
      );
    }
  }

  async getAll(user: AuthUser, filter: IFilter, waiterCode?: string): Promise<Reservation[]> {
    const { limit, skip, all } = filter;
    const columns = ['status', 'user.username', 'restaurant.name'];

    try {
      let effectiveWaiterId = user.role === StaffRole.WAITER ? user.id : null;

      // If waiter code is provided, get the waiter's ID from the code
      if (waiterCode) {
        try {
          const waiter = await this.waiterCodeService.findUserByWaiterCode(waiterCode);
          effectiveWaiterId = waiter.id;
        } catch (error) {
          throw new HttpException('Invalid waiter code', HttpStatus.FORBIDDEN);
        }
      }

      const queryBuilder = this.reservationRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .leftJoinAndSelect(
          'reservation.tables',
          'tables',
          'tables.deleted_at IS NULL',
        )
        .leftJoinAndSelect('tables.space', 'space', 'space.deleted_at IS NULL')
        .leftJoinAndSelect(
          'reservation.restaurant',
          'restaurant',
          'restaurant.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'restaurant.reviews',
          'reviews',
          'reviews.is_client_review = true AND reviews.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'reservation.user',
          'user',
          'user.deleted_at IS NULL',
        )
        .where('reservation.deleted_at IS NULL')
        .orderBy('reservation.date', 'DESC');

      if (user.role === Role.USER) {
        queryBuilder.andWhere('reservation.user_id = :userId', {
          userId: user.id,
        });
      } else if (effectiveWaiterId) {
        queryBuilder.andWhere('reservation.waiter_id = :waiterId', {
          waiterId: effectiveWaiterId,
        });
      } else {
        queryBuilder.andWhere('reservation.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        });
      }

      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.alias,
        'updated_at',
        filter,
      );

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);
      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const reservations = await queryBuilder.getMany();
      const countReservations = await queryBuilder.getCount();

      for (const reservation of reservations) {
        const {
          tables,
          restaurant: { reviews, name: restaurantName, id: restaurantId },
          user: { username: clientName },
        } = reservation;

        const reviewCount = reviews.length;

        const tableNames = [
          ...new Set(tables.map((table) => table.tableName)),
        ].sort();
        const spaceNames = [
          ...new Set(tables.map((table) => table.space.name)),
        ].sort();
        const tableIds = [...new Set(tables.map((table) => table.id))];
        const totalSeats = tables.reduce((sum, table) => sum + +table.seats, 0);

        const transformedReservation = {
          tableIds,
          clientName,
          tableName: tableNames,
          totalSeats,
          spaceName: spaceNames,
          restaurantId,
          restaurantName,
          restaurantReviewsNumber: reviewCount,
          restaurantRating:
            reviewCount > 0 ? this.calculateReviewsRating(reviews) : 0,
        };

        Object.assign(reservation, transformedReservation);

        delete reservation.tables;
        delete reservation.restaurant;
      }

      const result = getPaginated({
        data: reservations,
        count: countReservations,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getById(reservationId: string, user: AuthUser, waiterCode?: string): Promise<Reservation> {
    let effectiveWaiterId = user.role === StaffRole.WAITER ? user.id : null;

    // If waiter code is provided, get the waiter's ID from the code
    if (waiterCode) {
      try {
        const waiter = await this.waiterCodeService.findUserByWaiterCode(waiterCode);
        effectiveWaiterId = waiter.id;
      } catch (error) {
        throw new HttpException('Invalid waiter code', HttpStatus.FORBIDDEN);
      }
    }

    const queryBuilder = this.reservationRepository.createQueryBuilder(
      this.alias,
    );

    queryBuilder
      .leftJoinAndSelect(
        'reservation.tables',
        'tables',
        'tables.deleted_at IS NULL',
      )
      .leftJoinAndSelect('tables.space', 'space', 'space.deleted_at IS NULL')
      .leftJoinAndSelect(
        'reservation.restaurant',
        'restaurant',
        'restaurant.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'restaurant.reviews',
        'reviews',
        'reviews.is_client_review = true AND reviews.deleted_at IS NULL',
      )
      .leftJoinAndSelect('reservation.user', 'user', 'user.deleted_at IS NULL')
      .where('reservation.id = :reservationId', { reservationId })
      .andWhere('reservation.deleted_at IS NULL');

    if (user.role === Role.USER) {
      queryBuilder.andWhere('reservation.user_id = :userId', {
        userId: user.id,
      });
    } else if (effectiveWaiterId) {
      queryBuilder.andWhere('reservation.waiter_id = :waiterId', {
        waiterId: effectiveWaiterId,
      });
    } else {
      queryBuilder.andWhere('reservation.restaurant_id = :restaurantId', {
        restaurantId: user.restaurantId,
      });
    }

    const reservation = await queryBuilder.getOne();

    if (!reservation) {
      throw new HttpException(
        ERROR_MESSAGES.reservationNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const {
      tables,
      restaurant: {
        reviews: restaurantReviews,
        name: restaurantName,
        id: restaurantId,
      },
      user: { username: clientName },
      reviews: reservationReviews,
    } = reservation;

    const reviewCount = restaurantReviews.length;

    const tableNames = [
      ...new Set(tables.map((table) => table.tableName)),
    ].sort();
    const spaceNames = [
      ...new Set(tables.map((table) => table.space.name)),
    ].sort();
    const tableIds = [...new Set(tables.map((table) => table.id))];

    const transformedReservation = {
      tableIds,
      clientName,
      tableName: tableNames,
      spaceName: spaceNames,
      restaurantId,
      restaurantName,
      restaurantReviewsNumber: reviewCount,
      restaurantRating:
        reviewCount > 0 ? this.calculateReviewsRating(restaurantReviews) : 0,
    };

    Object.assign(reservation, transformedReservation);

    if (reservationReviews && reservationReviews.length > 0) {
      reservationReviews.forEach((review) => {
        const { username, avatar } = review.user;
        review['userName'] = username;
        review['userAvatar'] = avatar
          ? `${process.env.AWS_STATIC_URL}/images/${avatar}`
          : null;
        delete review.user;
      });
    }

    delete reservation.tables;
    delete reservation.restaurant;
    delete reservation.user;

    return reservation;
  }

  async getAllByTable(
    filter: IFilter,
    tableId: string,
    user: AuthUser,
  ): Promise<Reservation[]> {
    try {
      const { limit, skip, all } = filter;
      const columns = ['created_at'];

      const queryBuilder = this.reservationRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .innerJoin(
          'reservation.tables',
          'tables',
          'tables.id = :tableId AND tables.deleted_at IS NULL',
          { tableId },
        )
        .innerJoin('reservation.user', 'user', 'user.deleted_at IS NULL')
        .select([
          'reservation.id as id',
          'reservation.created_at as createdAt',
          'reservation.updated_at as updatedAt',
          'reservation.deleted_at as deletedAt',
          'reservation.date as date',
          'reservation.start_time as startTime',
          'reservation.end_time as endTime',
          'reservation.status as status',
          'reservation.guests_number as guestsNumber',
          'tables.id as tableId',
          'reservation.user_id as userId',
          'reservation.waiter_id as waiterId',
          'reservation.restaurant_id as restaurantId',
          'reservation.number as number',
          'reservation.reason as reason',
          'user.username as clientName',
        ])
        .where('reservation.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('reservation.deleted_at IS NULL');

      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.alias,
        'created_at',
        filter,
      );
      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);

      queryBuilder.groupBy('reservation.id');

      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getRawMany', filter);

      const reservations = await queryBuilder.getRawMany();
      const countReservation = await queryBuilder.getCount();

      const result = getPaginated({
        data: reservations,
        count: countReservation,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getReservationClients(filter: IFilter, user: AuthUser): Promise<any> {
    try {
      const { limit, skip, all } = filter;
      const queryBuilder = this.reservationRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .leftJoinAndSelect(
          'reservation.user',
          'user',
          'user.deleted_at IS NULL',
        )
        .select([
          'DISTINCT user.id as id',
          'user.username as username',
          'user.phone_number as phoneNumber',
          'user.email as email',
        ])
        .where('reservation.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('reservation.status = :status', {
          status: ReservationStatus.CLOSED,
        })
        .andWhere('reservation.deleted_at IS NULL');

      if (filter && filter.search) {
        queryBuilder.andWhere('user.username LIKE :username', {
          username: `%${filter.search.toString()}%`,
        });
      }

      const distinctClients = await queryBuilder
        .clone()
        .select('COUNT(DISTINCT user.id)', 'count')
        .getRawOne();

      FilterUtils.applyPagination(queryBuilder, 'getRawMany', filter);

      const clients = await queryBuilder.getRawMany();

      const result = getPaginated({
        data: clients,
        count: +distinctClients.count,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getClientRezervationById(
    reservationId: string,
    user: AuthUser,
  ): Promise<any> {
    const reservation = await this.reservationRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(
        'reservation.restaurant',
        'restaurant',
        'restaurant.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'reservation.tables',
        'tables',
        'tables.deleted_at IS NULL',
      )
      .leftJoinAndSelect('tables.space', 'space', 'space.deleted_at IS NULL')
      .leftJoinAndSelect(
        'reservation.waiter',
        'waiter',
        'waiter.deleted_at IS NULL',
      )
      .leftJoinAndSelect('reservation.user', 'user', 'user.deleted_at IS NULL')
      .leftJoinAndSelect(
        'reservation.orders',
        'orders',
        'orders.deleted_at IS NULL',
      )
      .where('reservation.id = :id', { id: reservationId })
      .andWhere('reservation.restaurant_id = :restaurantId', {
        restaurantId: user.restaurantId,
      })
      .andWhere('reservation.deleted_at IS NULL')
      .getOne();

    if (!reservation) {
      throw new HttpException(
        ERROR_MESSAGES.reservationNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const {
      tables,
      restaurant: { name: restaurantName },
    } = reservation;

    const tableNames = [
      ...new Set(tables.map((table) => table.tableName)),
    ].sort();
    const spaceNames = [
      ...new Set(tables.map((table) => table.space.name)),
    ].sort();
    const tableSeats = tables.reduce((sum, table) => sum + +table.seats, 0);

    const formattedReservation = {
      id: reservation.id,
      reservationNumber: reservation.number,
      ordersTotal: +reservation.orders
        .reduce((subtotal, order) => subtotal + +order.price, 0)
        .toFixed(2),
      general: {
        place: restaurantName,
        space: spaceNames,
        table: tableNames,
        tableSeats,
        quests: reservation.guestsNumber,
        date: reservation.date,
        status: reservation.status,
        waiterName: reservation.waiter?.username,
        waiterAvatar: reservation.waiter?.avatar
          ? `${process.env.AWS_STATIC_URL}/images/${reservation.waiter?.avatar}`
          : null,
      },
      orders: reservation.orders.map((order) => ({
        title: order.title,
        quantity: +order.quantity,
        price: +order.price,
      })),
      contacts: {
        username: reservation.user?.username || null,
        avatarUrl: reservation.user?.avatar
          ? `${process.env.AWS_STATIC_URL}/images/${reservation.user?.avatar}`
          : null,
        phoneNumber: reservation.user?.phoneNumber || null,
      },
    };

    return formattedReservation;
  }

  async create(
    user: AuthUser,
    createReservationDto: CreateReservationDto,
    i18n: any,
    waiterCode?: string,
  ): Promise<Reservation> {
    try {
      const { tableIds, restaurantId, userId, waiterId } = createReservationDto;
      const staffRoles = [
        StaffRole.WAITER,
        StaffRole.SUPER_HOSTESS,
        StaffRole.HOSTESS,
      ];
      const isStaff = staffRoles.includes(user.role as StaffRole);

      let effectiveWaiterId = user.role === StaffRole.WAITER ? user.id : waiterId || null;

      // If waiter code is provided, validate and get the waiter's ID
      if (waiterCode) {
        try {
          const waiter = await this.waiterCodeService.findUserByWaiterCode(waiterCode);
          effectiveWaiterId = waiter.id;
        } catch (error) {
          throw new HttpException('Invalid waiter code', HttpStatus.FORBIDDEN);
        }
      }

      const tables = await this.tableRepository
        .createQueryBuilder('table')
        .leftJoinAndSelect('table.space', 'space', 'space.deleted_at IS NULL')
        .leftJoinAndSelect(
          'space.restaurant',
          'restaurant',
          'restaurant.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'restaurant.reviews',
          'reviews',
          'reviews.is_client_review = true AND reviews.deleted_at IS NULL',
        )
        .where('table.id IN (:...tableIds)', { tableIds: [null, ...tableIds] })
        .andWhere('table.deleted_at IS NULL')
        .getMany();

      const nonValidTables = tables.some(
        (table) => table.space.restaurantId !== restaurantId,
      );
      if (nonValidTables) {
        throw new HttpException(
          ERROR_MESSAGES.cannotCreateForeignReservation,
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.validateReservationTime(createReservationDto);
      await this.checkTimeOverlap(createReservationDto, tableIds);

      const baseTable = tables[0];
      const reservation = this.reservationRepository.create({
        ...createReservationDto,
        status: isStaff
          ? createReservationDto.status || ReservationStatus.CONFIRMED
          : ReservationStatus.PENDING,
        restaurantId: baseTable.space.restaurantId,
        tableId: baseTable.id,
        userId: userId || user.id,
        waiterId: effectiveWaiterId,
        number: (await this.getLastReservationNumber(restaurantId)) + 1,
        tables,
      });

      reservation['tableIds'] = tableIds;

      await this.bonusService.createUserBonus(userId || user.id, reservation);

      const createdReservation = await this.reservationRepository.save(
        reservation,
      );

      const client =
        isStaff && userId
          ? await this.userRepository.findOneBy({ id: userId, deletedAt: null })
          : null;

      const transformedReservation = {
        clientName: client ? client.username : user.username,
        tableName: [...new Set(tables.map((table) => table.tableName))].sort(),
        spaceName: [...new Set(tables.map((table) => table.space.name))].sort(),
        restaurantId: baseTable.space.restaurant.id,
        restaurantName: baseTable.space.restaurant.name,
        restaurantReviewsNumber: baseTable.space.restaurant.reviews.length,
        restaurantRating:
          baseTable.space.restaurant.reviews.length > 0
            ? this.calculateReviewsRating(baseTable.space.restaurant.reviews)
            : 0,
      };

      Object.assign(createdReservation, transformedReservation);

      delete createdReservation.tables;

      await this.notificationService.sendReservationNotification(
        {
          user,
          reservation: {
            ...createdReservation,
            restaurantId: createdReservation.restaurantId,
            clientId: client ? client.id : user.id,
            waiterId: effectiveWaiterId,
          },
          isReservationCreate: true,
        },
        i18n,
      );

      return createdReservation;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async update(
    reservationId: string,
    updateReservationDto: UpdateReservationDto,
    user: AuthUser,
    i18n: any,
    waiterCode?: string,
  ): Promise<any> {
    try {
      let effectiveWaiterId = user.role === StaffRole.WAITER ? user.id : null;

      // If waiter code is provided, validate and get the waiter's ID
      if (waiterCode) {
        try {
          const waiter = await this.waiterCodeService.findUserByWaiterCode(waiterCode);
          effectiveWaiterId = waiter.id;
        } catch (error) {
          throw new HttpException('Invalid waiter code', HttpStatus.FORBIDDEN);
        }
      }

      let updatedReservation = null;
      const { tableIds: newTableIds } = updateReservationDto;

      delete updateReservationDto.tableIds;

      const reservation = await this.reservationRepository
        .createQueryBuilder(this.alias)
        .leftJoinAndSelect(
          'reservation.tables',
          'tables',
          'tables.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'reservation.restaurant',
          'restaurant',
          'restaurant.deleted_at IS NULL',
        )
        .where('reservation.id = :reservationId', { reservationId })
        .andWhere('reservation.deleted_at IS NULL')
        .getOne();

      if (!reservation) {
        throw new HttpException(
          ERROR_MESSAGES.reservationNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      // Check waiter access if applicable
      if (effectiveWaiterId) {
        await this.validateWaiterAccess(effectiveWaiterId, reservationId, user, waiterCode);
      }

      const tableIds = reservation.tables.map((table) => table.id);
      await this.checkTimeOverlap(
        updateReservationDto,
        tableIds,
        reservation.id,
      );

      if (
        user.role === Role.USER &&
        ![
          ReservationStatus.PENDING,
          ReservationStatus.PENDING_PREORDER,
        ].includes(reservation.status)
      ) {
        throw new HttpException(
          ERROR_MESSAGES.cannotUpdateReservation,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (newTableIds && newTableIds.length > 0) {
        const newTables = await this.tableRepository.find({
          where: { id: In(newTableIds), deletedAt: null },
        });

        if (!newTableIds.includes(reservation.tableId)) {
          updateReservationDto.tableId = newTables[0].id;
        }

        await this.reservationRepository.manager.transaction(
          async (manager) => {
            reservation.tables = newTables;

            for (const field in updateReservationDto) {
              reservation[field] = updateReservationDto[field];
            }

            await manager.save(reservation);

            updatedReservation = reservation;
          },
        );
      } else {
        updatedReservation = this.reservationRepository.create({
          ...reservation,
          ...updateReservationDto,
        });

        await this.reservationRepository.save(updatedReservation);
      }

      if (updateReservationDto.status === ReservationStatus.CLOSED) {
        await this.orderService.completeOrdersByReservationId(reservationId);
      }

      await this.notificationService.sendReservationNotification(
        {
          user,
          reservation: {
            ...updatedReservation,
            clientName: user.username,
            restaurantName: reservation.restaurant.name,
            clientId: reservation.userId,
          },
          isReservationCreate: false,
          isStatusChange: !!updateReservationDto.status,
        },
        i18n,
      );

      return updatedReservation;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(reservationId: string, user: AuthUser, waiterCode?: string) {
    let effectiveWaiterId = user.role === StaffRole.WAITER ? user.id : null;

    // If waiter code is provided, validate and get the waiter's ID
    if (waiterCode) {
      try {
        const waiter = await this.waiterCodeService.findUserByWaiterCode(waiterCode);
        effectiveWaiterId = waiter.id;
      } catch (error) {
        throw new HttpException('Invalid waiter code', HttpStatus.FORBIDDEN);
      }
    }

    // Check waiter access if applicable
    if (effectiveWaiterId) {
      await this.validateWaiterAccess(effectiveWaiterId, reservationId, user, waiterCode);
    }

    const reservation = await this.reservationRepository.findOne({
      where: {
        id: reservationId,
        restaurantId: user.restaurantId,
        deletedAt: null,
      },
    });

    if (!reservation) {
      throw new HttpException(
        ERROR_MESSAGES.reservationNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.reservationRepository.softRemove(reservation);

    return { deleted: true };
  }

  private calculateReviewsRating(reviews: Review[]): number {
    const sumRatings = reviews.reduce(
      (acc, review) => {
        acc.foodSum += review.foodRating;
        acc.serviceSum += review.serviceRating;
        acc.priceSum += review.priceRating;
        acc.ambienceSum += review.ambienceRating;
        return acc;
      },
      { foodSum: 0, serviceSum: 0, priceSum: 0, ambienceSum: 0 },
    );

    const { foodSum, serviceSum, priceSum, ambienceSum } = sumRatings;

    const rating = +(
      (foodSum + serviceSum + priceSum + ambienceSum) /
      (reviews.length * 4)
    ).toFixed(2);

    return rating;
  }

  private async getLastReservationNumber(
    restaurantId: string,
  ): Promise<number> {
    const { lastReservationNumber } = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('reservation.deleted_at IS NULL')
      .select('MAX(reservation.number)', 'lastReservationNumber')
      .getRawOne();

    return lastReservationNumber;
  }

  private async checkTimeOverlap(
    partialReservation: Partial<Reservation>,
    tableIds: string[],
    reservationId?: string,
  ): Promise<void> {
    const { status, startTime, endTime } = partialReservation;
    const statuses = [
      ReservationStatus.CANCELLED,
      ReservationStatus.CLOSED,
      ReservationStatus.DISHONORED,
      ReservationStatus.REJECTED,
    ];

    const isNeitherTimeSet = !startTime && !endTime;
    const isEndTimeSetWithStatus =
      !startTime && endTime && statuses.includes(status);

    if (isNeitherTimeSet || isEndTimeSetWithStatus) {
      return;
    }

    const qb = this.reservationRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect('reservation.tables', 'tables')
      .where('reservation.deleted_at IS NULL')
      .andWhere('reservation.status NOT IN (:...statuses)', { statuses })
      .andWhere('tables.deleted_at IS NULL')
      .andWhere('tables.id IN (:...tableIds)', {
        tableIds: [null, ...tableIds],
      });

    if (startTime && endTime) {
      qb.andWhere(
        '(reservation.start_time < :endTime AND reservation.end_time > :startTime)',
        {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
        },
      );
    } else if (startTime) {
      qb.andWhere(
        '(:startTime BETWEEN reservation.start_time AND reservation.end_time)',
        {
          startTime: new Date(startTime),
        },
      );
    } else if (endTime) {
      qb.andWhere(
        '(:endTime BETWEEN reservation.start_time AND reservation.end_time)',
        {
          endTime: new Date(endTime),
        },
      );
    }

    if (reservationId) {
      qb.andWhere('reservation.id != :reservationId', {
        reservationId,
      });
    }

    const reservations = await qb.getCount();

    if (reservations > 0) {
      throw new HttpException(
        ERROR_MESSAGES.tableAlreadyReserved,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async validateReservationTime(
    reservation: Partial<Reservation>,
  ): Promise<void> {
    const { date, startTime, endTime } = reservation;

    if (!date && !startTime && !endTime) {
      return;
    }

    const currentTime = new Date().getTime();
    const dateTime = new Date(date).getTime();
    const startDateTime = new Date(startTime).getTime();
    const endDateTime = new Date(endTime).getTime();

    const inThePast = [dateTime, startDateTime, endDateTime].some(
      (time) => time < currentTime,
    );
    const isDateBeforeStartTime = dateTime > startDateTime;
    const isStartTimeBeforeOrEqualEndTime = startDateTime >= endDateTime;

    if (inThePast) {
      throw new HttpException(
        ERROR_MESSAGES.reservationTimeInThePast,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (isDateBeforeStartTime) {
      throw new HttpException(
        ERROR_MESSAGES.reservationDateBeforeStartTime,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (isStartTimeBeforeOrEqualEndTime) {
      throw new HttpException(
        ERROR_MESSAGES.reservationStartTimeBeforeOrEqualEndTime,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async pickReservation(
    reservationId: string,
    user: AuthUser,
    waiterCode?: string,
    i18n?: any,
  ): Promise<Reservation> {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id: reservationId, deletedAt: null },
        relations: ['restaurant']
      });

      if (!reservation) {
        throw new HttpException(
          'Reservation not found',
          HttpStatus.NOT_FOUND
        );
      }

      // Verify the reservation belongs to the requesting user's restaurant
      if (reservation.restaurantId !== user.restaurantId) {
        throw new HttpException(
          'You are not authorized to access reservations from other restaurants',
          HttpStatus.FORBIDDEN
        );
      }

      // Check if reservation is already assigned
      if (reservation.waiterId) {
        throw new HttpException(
          'This reservation is already assigned to a waiter',
          HttpStatus.BAD_REQUEST
        );
      }

      let effectiveWaiterId = user.id;

      // If waiter code is provided, validate and get the waiter's ID
      if (waiterCode) {
        const waiter = await this.waiterCodeService.findUserByWaiterCode(waiterCode);
        
        if (!waiter) {
          throw new HttpException(
            'Invalid waiter code',
            HttpStatus.FORBIDDEN
          );
        }

        effectiveWaiterId = waiter.id;
      }

      // Update reservation with new waiter
      reservation.waiterId = effectiveWaiterId;
      const updatedReservation = await this.reservationRepository.save(reservation);

      // Send notification about the pickup if i18n is provided
      if (i18n) {
        await this.notificationService.sendReservationNotification(
          {
            user,
            reservation: {
              ...updatedReservation,
              clientName: user.username,
              restaurantName: reservation.restaurant.name,
              clientId: reservation.userId,
              waiterId: effectiveWaiterId,
            },
            isReservationCreate: false,
            isStatusChange: false,
          },
          i18n,
        );
      }

      return updatedReservation;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
