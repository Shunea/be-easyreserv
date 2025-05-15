import * as dotenv from 'dotenv';
import prettify from '@src/common/prettify';
import { CreateTableDto } from '../dto/createTable.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '@src/reservation/entities/reservation.entity';
import { Space } from '@src/place/entities/space.entity';
import { Table } from '../entities/table.entity';
import { UpdateTableDto } from '../dto/updateTable.dto';
import { getPaginated } from '@src/common/pagination';
import { plainToClass } from 'class-transformer';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import * as moment from 'moment';
import { response } from 'express';

dotenv.config();

@Injectable()
export class TableService {
  private alias = 'table';

  constructor(
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    @InjectRepository(Space)
    private spaceRepository: Repository<Space>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
  ) {}

  async getAll(filter: IFilter, user: AuthUser): Promise<Table[]> {
    const { limit, skip, all } = filter;
    const columns = ['table_name', 'seats', 'shape'];
    try {
      const queryBuilder = this.tableRepository.createQueryBuilder(this.alias);

      queryBuilder
        .innerJoin('table.space', 'space', 'space.deleted_at IS NULL')
        .where('table.deleted_at IS NULL')
        .andWhere('space.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        });

      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.alias,
        'created_at',
        filter,
      );

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);

      queryBuilder.groupBy('table.id');

      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const tables = await queryBuilder.getMany();
      const tablesCount = await queryBuilder.getCount();

      const result = getPaginated({
        data: tables,
        count: tablesCount,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllBySpaceId(
    spaceId: string,
    user: AuthUser,
    date: string,
  ): Promise<any> {
    try {
      const queryDate = date ? date : moment().format('YYYY-MM-DD');
      const tables = await this.tableRepository
        .createQueryBuilder(this.alias)
        .leftJoinAndSelect(
          'table.reservations',
          'reservations',
          'DATE(reservations.date) = :date AND reservations.deleted_at IS NULL',
          { date: queryDate },
        )
        .leftJoin(
          'table.space',
          'space',
          'space.restaurant_id = :restaurantId AND space.deleted_at IS NULL',
          { restaurantId: user.restaurantId },
        )
        .leftJoinAndSelect(
          'reservations.orders',
          'orders',
          'orders.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'reservations.user',
          'user',
          'user.deleted_at IS NULL',
        )
        .addSelect(['user.username', 'user.phoneNumber', 'user.avatar'])
        .where('table.space_id = :spaceId', { spaceId })
        .andWhere('table.deleted_at IS NULL')
        .getMany();

      if (tables && tables.length === 0) {
        return response.status(HttpStatus.NOT_FOUND).json({
          message: ERROR_MESSAGES.tableNotFound,
        });
      }

      const filteredReservations = tables.flatMap((table) =>
        table.reservations.map((reservation) => ({
          reservationId: reservation.id,
          tableId: table.id,
          guestsNumber: reservation.guestsNumber,
          tableSeats: table.seats,
        })),
      );

      const groupedReservations = filteredReservations.reduce(
        (acc, reservation) => {
          const { reservationId } = reservation;
          acc[reservationId] = acc[reservationId] || [];
          acc[reservationId].push(reservation);
          return acc;
        },
        {},
      );

      const occupiedSeats = {};

      for (const reservationId in groupedReservations) {
        occupiedSeats[reservationId] = {};
        let totalOccupied = 0;

        for (const reservation of groupedReservations[reservationId]) {
          const { tableId, guestsNumber, tableSeats } = reservation;

          occupiedSeats[reservationId][tableId] =
            (occupiedSeats[reservationId][tableId] || 0) +
            Math.min(guestsNumber - totalOccupied, tableSeats);

          totalOccupied += occupiedSeats[reservationId][tableId];
        }
      }

      for (const table of tables) {
        for (const reservation of table.reservations) {
          const reservationId = reservation.id;
          const tableId = table.id;

          if (
            occupiedSeats[reservationId] &&
            occupiedSeats[reservationId][tableId]
          ) {
            reservation['occupiedSeats'] =
              occupiedSeats[reservationId][tableId];
          }
        }
      }

      return tables;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getById(tableId: string): Promise<Table> {
    const table = await this.tableRepository
      .createQueryBuilder(this.alias)
      .where('table.id = :tableId', { tableId })
      .andWhere('table.deleted_at IS NULL')
      .getOne();

    if (!table) {
      throw new HttpException(
        ERROR_MESSAGES.tableNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .select([
        'reservation',
        'order',
        'user.username',
        'user.phoneNumber',
        'user.avatar',
      ])
      .leftJoin('reservation.orders', 'order', 'order.deleted_at IS NULL')
      .leftJoin(
        'reservation.user',
        'user',
        'user.id = reservation.userId AND user.deleted_at IS NULL',
      )
      .where('reservation.tableId = :tableId', { tableId })
      .andWhere('reservation.deleted_at IS NULL')
      .getMany();

    table.reservations = reservations.map((reservation) => {
      if (reservation.user.avatar) {
        reservation.user.avatar = `${process.env.AWS_STATIC_URL}/images/${reservation.user.avatar}`;
      }
      return reservation;
    });

    return table;
  }

  async create(
    createTableDto: CreateTableDto,
    spaceId: string,
  ): Promise<Table> {
    const table = plainToClass(Table, createTableDto);

    const space = await this.spaceRepository.findOne({
      where: { id: spaceId, deletedAt: null },
    });

    if (!space) {
      throw new HttpException(
        ERROR_MESSAGES.spaceNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    table.space = space;

    return await this.tableRepository.save(table);
    // return await this.tableRepository.save(table).then((res) => {
    //   return res;
    // });
  }

  async update(
    spaceId: string,
    tableId: string,
    updateTableDto: UpdateTableDto,
  ): Promise<any> {
    const table = await this.tableRepository.findOne({
      where: {
        id: tableId,
        deletedAt: null,
      },
    });

    if (!table) {
      throw new HttpException(
        ERROR_MESSAGES.tableNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const space = await this.spaceRepository.findOne({
      where: { id: spaceId, deletedAt: null },
    });

    if (!space) {
      throw new HttpException(
        ERROR_MESSAGES.spaceNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    table.space = space;

    Object.assign(table, updateTableDto);

    return this.tableRepository.save(table);
  }

  async delete(tableId: string) {
    const table = await this.tableRepository.findOne({
      where: { id: tableId, deletedAt: null },
      relations: ['reservations.orders'],
    });

    if (!table) {
      throw new HttpException(
        ERROR_MESSAGES.tableNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.tableRepository.softRemove(table);

    return { deleted: true };
  }
}
