import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateTransportDto } from '../dto/createTransport.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { Transport } from '../entities/transport.entity';
import { UpdateTransportDto } from '../dto/updateTransport.dto';
import { User } from '@src/user/entities/user.entity';
import { getPaginated } from '@src/common/pagination';

@Injectable()
export class TransportService {
  private alias = 'transport';

  constructor(
    @InjectRepository(Transport)
    private readonly transportRepository: Repository<Transport>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(user: AuthUser, createTransportDto: CreateTransportDto) {
    try {
      const { registrationNumber, userIds } = createTransportDto;

      const transport = await this.transportRepository
        .createQueryBuilder(this.alias)
        .where('transport.registration_number = :registrationNumber', {
          registrationNumber,
        })
        .andWhere('transport.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('transport.deleted_at IS NULL')
        .getOne();

      if (transport) {
        throw new HttpException(
          ERROR_MESSAGES.transportAlreadyExists,
          HttpStatus.BAD_REQUEST,
        );
      }

      const users = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id IN (:...userIds)', { userIds: [null, ...userIds] })
        .andWhere('user.role = :role', { role: StaffRole.DRIVER })
        .andWhere('user.deleted_at IS NULL')
        .getMany();

      const newTransport = this.transportRepository.create({
        ...createTransportDto,
        restaurantId: user.restaurantId,
        users,
      });

      const createdTransport = await this.transportRepository.save(
        newTransport,
      );

      return createdTransport;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAll(user: AuthUser, filter: IFilter) {
    const { limit, skip, all } = filter;
    const columns = ['transport_id', 'seats', 'mileage', 'region', 'type'];

    try {
      const queryBuilder = this.transportRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .leftJoinAndSelect('transport.users', 'user')
        .where('transport.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('transport.deleted_at IS NULL');

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

      const transports = await queryBuilder.getMany();
      const countTransports = await queryBuilder.getCount();

      transports.forEach((transport) =>
        transport.users.forEach((user) => {
          user.avatar = user.avatar
            ? `${process.env.AWS_STATIC_URL}/images/${user.avatar}`
            : null;
        }),
      );

      const results = getPaginated({
        data: transports,
        count: countTransports,
        skip,
        limit,
        all,
      });

      return prettify(results);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getById(id: string, user: AuthUser) {
    const transport = await this.transportRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect('transport.users', 'user')
      .where('transport.id = :id', { id })
      .andWhere('transport.restaurant_id = :restaurantId', {
        restaurantId: user.restaurantId,
      })
      .andWhere('transport.deleted_at IS NULL')
      .getOne();

    if (!transport) {
      throw new HttpException(
        ERROR_MESSAGES.transportNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return transport;
  }

  async update(
    id: string,
    updateTransportDto: UpdateTransportDto,
    user: AuthUser,
  ) {
    let updatedTransport = null;
    const transport = await this.transportRepository.findOne({
      where: { id: id, restaurantId: user.restaurantId, deletedAt: null },
    });

    const { userIds: newUserIds, registrationNumber } = updateTransportDto;

    if (registrationNumber) {
      const transport = await this.transportRepository
        .createQueryBuilder(this.alias)
        .where('transport.registration_number = :registrationNumber', {
          registrationNumber,
        })
        .andWhere('transport.deleted_at IS NULL')
        .getOne();

      if (transport) {
        throw new HttpException(
          ERROR_MESSAGES.transportAlreadyExists,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (newUserIds && newUserIds.length > 0) {
      const newUsers = await this.userRepository
        .createQueryBuilder('user')
        .where('user.id IN (:...userIds)', { userIds: [null, ...newUserIds] })
        .andWhere('user.role = :role', { role: StaffRole.DRIVER })
        .andWhere('user.deleted_at IS NULL')
        .getMany();

      await this.transportRepository.manager.transaction(async (manager) => {
        transport.users = newUsers;

        for (const field in updateTransportDto) {
          transport[field] = updateTransportDto[field];
        }

        await manager.save(transport);

        updatedTransport = transport;
      });
    } else {
      updatedTransport = await this.transportRepository.create({
        ...transport,
        ...updateTransportDto,
      });

      await this.transportRepository.save(updatedTransport);
    }

    return updatedTransport;
  }

  async delete(id: string, user: AuthUser) {
    const transport = await this.transportRepository.findOne({
      where: { id: id, restaurantId: user.restaurantId, deletedAt: null },
    });

    if (!transport) {
      throw new HttpException(
        ERROR_MESSAGES.transportNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.transportRepository.softRemove(transport);

    return { deleted: true };
  }
}
