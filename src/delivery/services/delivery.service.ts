import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { IFilter } from '@src/middlewares/QueryParser';
import { DeliveryOrder } from '../entities/delivery-order.entity';
import { CreateDeliveryOrderDto } from '../dto/create-delivery-order.dto';
import { UpdateDeliveryOrderDto } from '../dto/update-delivery-order.dto';
import { getPaginated } from '@src/common/pagination';
import { plainToClass } from 'class-transformer';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { Role } from '@src/user/enums/roles.enum';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { Client, TravelMode } from '@googlemaps/google-maps-services-js';
import { ConfigService } from '@nestjs/config';
import { UpdateLocationDto } from '../dto/update-location.dto';

@Injectable()
export class DeliveryService {
  private alias = 'delivery_orders';
  private googleMapsClient: Client;

  constructor(
    @InjectRepository(DeliveryOrder)
    private readonly deliveryOrderRepository: Repository<DeliveryOrder>,
    private readonly configService: ConfigService,
  ) {
    this.googleMapsClient = new Client({});
  }

  async create(
    createDeliveryOrderDto: CreateDeliveryOrderDto,
    request: any,
  ): Promise<DeliveryOrder> {
    const operatorId = request.user.id;
    const order = plainToClass(DeliveryOrder, {
      ...createDeliveryOrderDto,
      operator_id: operatorId,
      operator_modified_at: new Date(),
      order_date: new Date(),
      courier_status: DeliveryStatus.PENDING,
    });

    try {
      const savedOrder = await this.deliveryOrderRepository.save(order);
      return savedOrder;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getAll(user: AuthUser, filter: IFilter) {
    try {
      const { limit, skip, all } = filter;
      const columns = ['courier_status', 'payment_type'];

      const queryBuilder = this.deliveryOrderRepository
        .createQueryBuilder(this.alias)
        .where(`${this.alias}.deleted_at IS NULL`);

      // Add role-based filtering
      if (user.role === StaffRole.OPERATOR) {
        queryBuilder.andWhere('delivery_orders.operator_id = :operatorId', {
          operatorId: user.id,
        });
      } else if (user.role === StaffRole.COURIER) {
        queryBuilder.andWhere('delivery_orders.courier_id = :courierId', {
          courierId: user.id,
        });
      }

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, columns);
      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const [orders, total] = await queryBuilder.getManyAndCount();

      return getPaginated({
        data: orders,
        count: total,
        skip,
        limit,
        all,
      });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  // ... other methods similar to document.service.ts ...

  async getById(orderId: string) {
    const order = await this.deliveryOrderRepository.findOne({
      where: { id: orderId, deleted_at: null },
      relations: [
        'restaurant',
        'operator',
        'courier',
        'items',
        'items.product',
      ],
    });

    if (!order) {
      throw new HttpException(
        ERROR_MESSAGES.orderNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return order;
  }

  async update(
    orderId: string,
    updateDeliveryOrderDto: UpdateDeliveryOrderDto,
  ): Promise<DeliveryOrder> {
    try {
      // First find the order
      const order = await this.deliveryOrderRepository
        .createQueryBuilder('delivery_orders')
        .where('delivery_orders.id = :id', { id: orderId })
        .andWhere('delivery_orders.deleted_at IS NULL')
        .getOne();

      if (!order) {
        throw new HttpException(
          ERROR_MESSAGES.orderNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      // Create update object
      const updateData = {
        ...order,
        ...updateDeliveryOrderDto,
        operator_modified_at: new Date(),
      };

      // Update using query builder
      await this.deliveryOrderRepository
        .createQueryBuilder()
        .update(DeliveryOrder)
        .set(updateData)
        .where('id = :id', { id: orderId })
        .execute();

      // Return updated order
      return await this.deliveryOrderRepository.findOne({
        where: { id: orderId },
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Update failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async delete(orderId: string) {
    const order = await this.deliveryOrderRepository.findOne({
      where: { id: orderId, deleted_at: null },
    });

    if (!order) {
      throw new HttpException(
        ERROR_MESSAGES.orderNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.deliveryOrderRepository.softDelete(orderId);
    return { deleted: true };
  }

  async getActiveOrders(user: AuthUser, filter: IFilter) {
    try {
      const { limit, skip, all } = filter;
      const queryBuilder = this.deliveryOrderRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .where('delivery_orders.courier_id = :courierId', {
          courierId: user.id,
        })
        .andWhere('delivery_orders.courier_status IN (:...statuses)', {
          statuses: [DeliveryStatus.IN_PREPARATION, DeliveryStatus.PICKED_UP],
        })
        .andWhere('delivery_orders.deleted_at IS NULL');

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const [orders, total] = await queryBuilder.getManyAndCount();

      return getPaginated({
        data: orders,
        count: total,
        skip,
        limit,
        all,
      });
    } catch (error) {
      throw new HttpException(JSON.stringify(error), error.status);
    }
  }

  async getAvailableOrders(user: AuthUser, filter: IFilter) {
    try {
      const { limit, skip, all } = filter;
      const queryBuilder = this.deliveryOrderRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .where('delivery_orders.courier_status = :status', {
          status: DeliveryStatus.PENDING,
        })
        .andWhere('delivery_orders.courier_id IS NULL')
        .andWhere('delivery_orders.deleted_at IS NULL');

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const [orders, total] = await queryBuilder.getManyAndCount();

      return getPaginated({
        data: orders,
        count: total,
        skip,
        limit,
        all,
      });
    } catch (error) {
      throw new HttpException(JSON.stringify(error), error.status);
    }
  }

  async calculateETA(
    restaurantLat: number,
    restaurantLng: number,
    courierLat: number,
    courierLng: number,
    clientLat: number,
    clientLng: number,
  ): Promise<{
    pickupTime: number; // Time for courier to reach restaurant
    deliveryTime: number; // Time from restaurant to client
    totalTime: number; // Total ETA including pickup and delivery
  }> {
    try {
      const apiKey = this.configService.get<string>('GOOGLE_API_KEY');

      // Calculate time for courier to reach restaurant
      const pickupResponse = await this.googleMapsClient.distancematrix({
        params: {
          origins: [{ lat: courierLat, lng: courierLng }],
          destinations: [{ lat: restaurantLat, lng: restaurantLng }],
          mode: TravelMode.driving,
          key: apiKey,
        },
      });

      // Calculate time from restaurant to client
      const deliveryResponse = await this.googleMapsClient.distancematrix({
        params: {
          origins: [{ lat: restaurantLat, lng: restaurantLng }],
          destinations: [{ lat: clientLat, lng: clientLng }],
          mode: TravelMode.driving,
          key: apiKey,
        },
      });

      const pickupTime = pickupResponse.data.rows[0].elements[0].duration.value;
      const deliveryTime =
        deliveryResponse.data.rows[0].elements[0].duration.value;

      return {
        pickupTime: Math.ceil(pickupTime / 60), // Convert seconds to minutes
        deliveryTime: Math.ceil(deliveryTime / 60),
        totalTime: Math.ceil((pickupTime + deliveryTime) / 60),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to calculate ETA',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateStatus(
    orderId: string,
    status: DeliveryStatus,
    user: AuthUser,
    position: UpdateLocationDto,
  ): Promise<DeliveryOrder> {
    try {
      const order = await this.deliveryOrderRepository.findOne({
        where: { id: orderId, deleted_at: null },
        relations: ['restaurant'],
      });

      if (!order) {
        throw new HttpException(
          ERROR_MESSAGES.orderNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      // Calculate ETA when courier accepts order
      if (status === DeliveryStatus.IN_PREPARATION) {
        // Update courier coordinates
        order.courier_latitude = position.latitude;
        order.courier_longitude = position.longitude;

        const eta = await this.calculateETA(
          order.restaurant.latitude,
          order.restaurant.longitude,
          order.courier_latitude,
          order.courier_longitude,
          order.client_latitude,
          order.client_longitude,
        );

        return await this.deliveryOrderRepository.save({
          ...order,
          courier_status: status,
          courier_id: user.id,
          estimated_delivery_time: eta.totalTime,
          operator_modified_at: new Date(),
        });
      }

      // Regular status update
      return await this.deliveryOrderRepository.save({
        ...order,
        courier_status: status,
        courier_id: user.id,
        courier_pickup_time:
          status === DeliveryStatus.PICKED_UP
            ? new Date()
            : order.courier_pickup_time,
        operator_modified_at: new Date(),
      });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  // Add method to update courier location
  async updateCourierLocation(
    orderId: string,
    latitude: number,
    longitude: number,
    user: AuthUser,
  ): Promise<DeliveryOrder> {
    try {
      const order = await this.deliveryOrderRepository.findOne({
        where: {
          id: orderId,
          courier_id: user.id,
          deleted_at: null,
        },
      });

      if (!order) {
        throw new HttpException(
          ERROR_MESSAGES.orderNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      return await this.deliveryOrderRepository.save({
        ...order,
        courier_latitude: latitude,
        courier_longitude: longitude,
        operator_modified_at: new Date(),
      });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
}
