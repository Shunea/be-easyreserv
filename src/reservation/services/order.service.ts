import * as dotenv from 'dotenv';
import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateOrderDto } from '../dto/createOrder.dto';
import { DeleteOrderDto } from '../dto/deleteOrders.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import {
  HttpException,
  HttpStatus,
  Injectable,
  MessageEvent,
} from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationService } from '@src/notification/services/notification.service';
import { Observable, Subject } from 'rxjs';
import { Order } from '../entities/order.entity';
import { OrderCommon } from '../order-common/order.common';
import { OrderStatus } from '../enums/orderStatus.enum';
import { PreparationZones } from '@src/product/enums/preparation-zones.enum';
import { Product } from '@src/product/entities/product.entity';
import { Repository } from 'typeorm';
import { Reservation } from '../entities/reservation.entity';
import { ReservationStatus } from '../enums/reservationStatus.enum';
import { Role } from '@src/user/enums/roles.enum';
import { UpdateOrderDto } from '../dto/updateOrder.dto';
import { getPaginated } from '@src/common/pagination';
import { map } from 'rxjs/operators';
import { FilterOrderDto } from '../dto/filter-order.dto';
import { Not, In } from 'typeorm';

dotenv.config();

@Injectable()
export class OrderService {
  private alias = 'order';
  private reservationAlias = 'reservation';

  private orderSubject = new Subject<any>();

  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,

    @InjectRepository(Order)
    private orderRepository: Repository<Order>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    private readonly orderCommon: OrderCommon,
    private readonly notificationService: NotificationService,
  ) {}

  async getAll(user: AuthUser, filterDto: FilterOrderDto): Promise<any[]> {
    try {
      console.log('========== GetAll Method Start ==========');
      console.log('Input parameters:');
      console.log('- User restaurant ID:', user.restaurantId);
      console.log('- Filter DTO:', JSON.stringify(filterDto, null, 2));

      // Build a single optimized query that gets all data at once
      const queryBuilder = this.reservationRepository
        .createQueryBuilder('reservation')
        .select([
          'reservation.id',
          'reservation.createdAt',
          'reservation.updatedAt',
          'user.id',
          'user.username',
          'waiter.id',
          'waiter.username',
          'tables.id',
          'tables.tableName',
          'space.id',
          'space.name',
          'orders.id',
          'orders.createdAt',
          'orders.updatedAt',
          'orders.deletedAt',
          'orders.title',
          'orders.quantity',
          'orders.status',
          'orders.price',
          'orders.isPreorder',
          'orders.creationNotice',
          'orders.serviceType',
          'orders.courseType',
          'orders.doneness',
          'product.id',
          'product.title',
          'product.preparationZone',
          'product.preparationTime',
          'category.id',
          'category.name'
        ])
        .innerJoin('reservation.user', 'user')
        .innerJoin('reservation.waiter', 'waiter')
        .innerJoin('reservation.tables', 'tables')
        .innerJoin('tables.space', 'space')
        .innerJoin('reservation.orders', 'orders')
        .innerJoin('orders.product', 'product')
        .innerJoin('product.category', 'category')
        .where('reservation.restaurantId = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('orders.deletedAt IS NULL')
        .andWhere('reservation.deletedAt IS NULL');

      // Apply filters
      if (filterDto.status) {
        console.log('Applying status filter:', filterDto.status);
        queryBuilder.andWhere('orders.status = :status', {
          status: filterDto.status,
        });
      }

      if (filterDto.preparationZone) {
        console.log('Applying preparation zone filter:', filterDto.preparationZone);
        queryBuilder.andWhere('product.preparationZone = :preparationZone', {
          preparationZone: filterDto.preparationZone,
        });
      }

      // Get all data in a single query
      const rawData = await queryBuilder.getMany();

      // Transform the raw data into the desired structure
      const result = rawData.map(reservation => {
        // Group orders by table
        const tableOrders = reservation.tables.map(table => ({
          tableId: table.id,
          tableName: table.tableName,
          spaceId: table.space?.id,
          spaceName: table.space?.name,
          createdAt: table.createdAt,
          updatedAt: table.updatedAt,
          orders: reservation.orders
            .filter(order => !order.deletedAt)
            .map(order => ({
              id: order.id,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              deletedAt: order.deletedAt,
              title: order.title,
              quantity: order.quantity,
              status: order.status,
              productId: order.product.id,
              price: order.price,
              isPreorder: order.isPreorder,
              creationNotice: order.creationNotice,
              serviceType: order.serviceType,
              courseType: order.courseType,
              doneness: order.doneness,
              productName: order.product.title,
              preparationZone: order.product.preparationZone,
              preparationTime: order.product.preparationTime,
              categoryName: order.product.category.name
            }))
        }));

        return {
          reservationId: reservation.id,
          createdAt: reservation.createdAt,
          updatedAt: reservation.updatedAt,
          clientId: reservation.user.id,
          clientName: reservation.user.username,
          waiterId: reservation.waiter.id,
          waiterName: reservation.waiter.username,
          tables: tableOrders
        };
      });

      // Apply pagination
      const page = filterDto.page || 1;
      const limit = filterDto.limit || 10;
      const skip = (page - 1) * limit;
      
      console.log('Pagination values:', { page, limit, skip });
      
      const paginatedResult = result.slice(skip, skip + limit);

      console.log('Pagination applied:');
      console.log(`- Total results: ${result.length}`);
      console.log(`- Page: ${page}`);
      console.log(`- Limit: ${limit}`);
      console.log(`- Skip: ${skip}`);
      console.log(`- Results after pagination: ${paginatedResult.length}`);

      console.log('========== GetAll Method End ==========');
      return paginatedResult;
    } catch (err) {
      console.error('========== Error in getAll ==========');
      console.error('Error details:', err);
      console.error('Error stack:', err.stack);
      throw new HttpException(err.message || 'Internal server error', err.status || HttpStatus.BAD_REQUEST);
    }
  }

  async getByReservation(
    reservationId: string, 
    filterDto: FilterOrderDto
  ): Promise<{ data: Order[]; total: number }> {
    try {
      // First verify the reservation exists
      const reservation = await this.reservationRepository.findOne({
        where: { id: reservationId, deletedAt: null }
      });

      if (!reservation) {
        throw new HttpException(
          ERROR_MESSAGES.reservationNotFound,
          HttpStatus.NOT_FOUND
        );
      }

      // Build the query with proper relations
      const queryBuilder = this.orderRepository
        .createQueryBuilder('order')
        .select([
          'order.id',
          'order.title',
          'order.quantity',
          'order.status',
          'order.price',
          'order.isPreorder',
          'order.creationNotice',
          'order.createdAt',
          'order.updatedAt',
          'order.serviceType',
          'order.courseType',
          'order.doneness',
          'product.id',
          'product.title',
          'product.preparationZone',
          'product.preparationTime',
          'category.id',
          'category.name'
        ])
        .innerJoin('order.product', 'product')
        .innerJoin('product.category', 'category')
        .where('order.reservationId = :reservationId', { reservationId })
        .andWhere('order.deletedAt IS NULL');

      // Apply filters
      if (filterDto.status) {
        queryBuilder.andWhere('order.status = :status', { 
          status: filterDto.status 
        });
      }

      if (filterDto.preparationZone) {
        queryBuilder.andWhere('product.preparationZone = :preparationZone', {
          preparationZone: filterDto.preparationZone
        });
      }

      // Add pagination
      const page = filterDto.page || 1;
      const limit = filterDto.limit || 10;
      const skip = (page - 1) * limit;

      queryBuilder
        .orderBy('order.createdAt', 'DESC')
        .skip(skip)
        .take(limit);

      // Get results with count
      const [orders, total] = await queryBuilder.getManyAndCount();

      // Transform the data while maintaining the Order entity instances
      const data = orders.map(order => {
        // Create a new Order instance
        const transformedOrder = this.orderRepository.create({
          ...order,
          product: {
            ...order.product,
            category: order.product.category
          }
        });

        return transformedOrder;
      });

      return { data, total };
    } catch (err) {
      console.error('Error in getByReservation:', err);
      throw new HttpException(
        err.message || 'Internal server error', 
        err.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  async getHistory(
    user: AuthUser, 
    filterDto: FilterOrderDto
  ): Promise<{ data: Order[]; total: number }> {
    try {
      console.log('GetHistory called with filterDto:', filterDto);
      console.log('User restaurant ID:', user.restaurantId);

      // Create base query
      const queryBuilder = this.orderRepository
        .createQueryBuilder(this.alias)
        .select([
          `${this.alias}`,
          'product',
          'category.id',
          'category.name',
          'reservation.id',
          'reservation.date',
          'reservation.status'
        ])
        .leftJoin(`${this.alias}.product`, 'product')
        .leftJoin('product.category', 'category')
        .leftJoin(`${this.alias}.reservation`, 'reservation')
        .where('reservation.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere(`${this.alias}.deleted_at IS NULL`);

      // Apply filters
      if (filterDto.status) {
        console.log('Applying status filter:', filterDto.status);
        queryBuilder.andWhere(`${this.alias}.status = :status`, { 
          status: filterDto.status 
        });
      } else {
        console.log('No status provided, excluding PENDING and PREPARING by default');
        queryBuilder.andWhere(`${this.alias}.status NOT IN (:...excludedStatuses)`, {
          excludedStatuses: [OrderStatus.PENDING, OrderStatus.PREPARING],
        });
      }

      if (filterDto.preparationZone) {
        console.log('Applying preparation zone filter:', filterDto.preparationZone);
        queryBuilder.andWhere('product.preparation_zone = :preparationZone', {
          preparationZone: filterDto.preparationZone,
        });
      }

      // Get total count before pagination
      const total = await queryBuilder.getCount();

      // Apply pagination and ordering
      const skip = (filterDto.page - 1) * filterDto.limit;
      queryBuilder
        .orderBy(`${this.alias}.created_at`, 'DESC')
        .offset(skip)
        .limit(filterDto.limit);

      console.log('Final SQL Query:', queryBuilder.getSql());
      console.log('Query Parameters:', queryBuilder.getParameters());

      const orders = await queryBuilder.getMany();
      console.log('Found orders:', orders.length);

      return {
        data: orders,
        total,
      };
    } catch (err) {
      console.error('Error in getHistory:', err);
      throw new HttpException(err.message || 'Internal server error', err.status || HttpStatus.BAD_REQUEST);
    }
  }

  async create(
    user: AuthUser,
    createOrderItems: CreateOrderDto[],
    reservationId: string,
    i18n: any,
  ) {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id: reservationId, deletedAt: null },
        relations: ['tables'],
      });

      if (!reservation) {
        throw new HttpException(
          ERROR_MESSAGES.reservationNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (
        user.role === Role.USER &&
        reservation.status !== ReservationStatus.CONFIRMED
      ) {
        throw new HttpException(
          ERROR_MESSAGES.reservationNotConfirmed,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Fetch all products at once to validate doneness
      const productIds = createOrderItems.map(item => item.productId);
      const products = await this.productRepository.find({
        where: { id: In(productIds), deletedAt: null }
      });

      // Validate doneness for each order item
      createOrderItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          throw new HttpException(
            `Product with ID ${item.productId} not found`,
            HttpStatus.NOT_FOUND
          );
        }

        if (item.doneness) {
          const allowedZones = [
            PreparationZones.Grill,
            PreparationZones.Fish,
            PreparationZones.Hot
          ];
          
          if (!allowedZones.includes(product.preparationZone)) {
            throw new HttpException(
              `Doneness level can only be set for items from Grill, Fish, or Hot preparation zones. Product ${product.title} is from ${product.preparationZone} zone.`,
              HttpStatus.BAD_REQUEST
            );
          }
        }
      });

      const orders = await this.orderCommon.processPlanCreate(
        user,
        createOrderItems.map(item => ({
          ...item,
          creationNotice: item.creationNotice || null,
          doneness: item.doneness || null,
          serviceType: item.serviceType,
          courseType: item.courseType
        })),
        reservation,
      );

      await this.notificationService.sendReservationOrderNotification(
        {
          staffRole: user.role,
          waiterId: reservation.waiterId || null,
          tableNames: reservation.tables
            .map(({ tableName }) => tableName)
            .sort()
            .join(','),
          restaurantId: reservation.restaurantId,
          existDrinks: orders.some(
            ({ product }) => product.preparationZone === PreparationZones.Bar,
          ),
          onlyDrinks: orders.every(
            ({ product }) => product.preparationZone === PreparationZones.Bar,
          ),
        },
        i18n,
      );

      const orderIds = orders.map(({ id }) => id);
      const sseOrders = await this.getOrdersForSSE(orderIds);

      this.orderSubject.next(sseOrders);

      return orders;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async update(user: AuthUser, orderId: string, updateDto: UpdateOrderDto) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId, deletedAt: null },
      });

      if (!order) {
        throw new HttpException(
          ERROR_MESSAGES.orderNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      // Handle notification messages first
      if (updateDto.creationNotice !== undefined || updateDto.deletionNotice !== undefined) {
        if (updateDto.creationNotice !== undefined) {
          order.creationNotice = updateDto.creationNotice;
        }
        if (updateDto.deletionNotice !== undefined) {
          order.deletionNotice = updateDto.deletionNotice;
        }
        await this.orderRepository.save(order);
        
        // If only updating notices, return early
        if (Object.keys(updateDto).length === 1 && 
            (updateDto.creationNotice !== undefined || updateDto.deletionNotice !== undefined)) {
          return order;
        }
      }

      // Only fetch product if we're updating other fields or if doneness is being set
      const product = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect(
          'product.productIngredients',
          'productIngredients',
          'productIngredients.deleted_at IS NULL',
        )
        .leftJoinAndSelect(
          'productIngredients.ingredient',
          'ingredient',
          'ingredient.deleted_at IS NULL',
        )
        .where('product.id = :productId', { 
          productId: updateDto.productId || order.productId 
        })
        .andWhere('product.deleted_at IS NULL')
        .getOne();

      // Validate doneness if it's being updated
      if (updateDto.doneness !== undefined) {
        if (!product) {
          throw new HttpException(
            'Product not found',
            HttpStatus.NOT_FOUND
          );
        }

        const allowedZones = [
          PreparationZones.Grill,
          PreparationZones.Fish,
          PreparationZones.Hot
        ];
        
        if (!allowedZones.includes(product.preparationZone)) {
          throw new HttpException(
            `Doneness level can only be set for items from Grill, Fish, or Hot preparation zones. Product ${product.title} is from ${product.preparationZone} zone.`,
            HttpStatus.BAD_REQUEST
          );
        }
      }

      return await this.orderCommon.processPlanUpdate(
        user,
        order,
        product,
        updateDto,
      );
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async updateStatus(
    orderId: string,
    user: AuthUser,
    updateDto: UpdateOrderDto,
    i18n: any,
    response: any,
  ) {
    try {
      if (!updateDto.status) {
        throw new HttpException(
          ERROR_MESSAGES.pleaseProvideAllParams,
          HttpStatus.BAD_REQUEST,
        );
      }

      const order = await this.orderRepository.findOne({
        where: { id: orderId, deletedAt: null },
      });

      if (!order) {
        throw new HttpException(
          ERROR_MESSAGES.orderNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const reservation = await this.reservationRepository
        .createQueryBuilder(this.reservationAlias)
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
        .leftJoinAndSelect(
          'orders.product',
          'product',
          'product.deleted_at IS NULL',
        )
        .where('reservation.id = :id', { id: order.reservationId })
        .andWhere('reservation.deleted_at IS NULL')
        .getOne();

      if (!reservation) {
        throw new HttpException(
          ERROR_MESSAGES.reservationNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (updateDto.status === OrderStatus.READY) {
        await this.notificationService.sendReservationOrderNotification(
          {
            staffRole: user.role,
            waiterId: reservation.waiterId || null,
            tableNames: reservation.tables
              .map(({ tableName }) => tableName)
              .sort()
              .join(','),
            restaurantId: reservation.restaurantId,
          },
          i18n,
        );
      }

      await this.orderRepository
        .createQueryBuilder(this.alias)
        .update(Order)
        .set({ status: updateDto.status })
        .where('order.id = :orderId', { orderId: order.id })
        .andWhere('order.deleted_at IS NULL')
        .execute();

      const sseOrders = await this.getOrdersForSSE([order.id]);

      this.orderSubject.next(sseOrders);

      return response.status(HttpStatus.OK).json({ updated: true });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(
    user: AuthUser,
    deleteOrderDto: DeleteOrderDto,
    reservationId: string,
  ) {
    try {
      const orderIds = deleteOrderDto.orderIds;
      const orders = await this.orderRepository
        .createQueryBuilder(this.alias)
        .where('order.id IN (:...orderIds)', { orderIds })
        .andWhere('order.deleted_at IS NULL')
        .getMany();

      await this.orderCommon.processPlanDelete(user, orders, reservationId);

      return { deleted: true };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  subscribeToOrders(): Observable<MessageEvent> {
    return this.orderSubject.asObservable().pipe(
      map(
        (orders) =>
          ({
            data: JSON.stringify(orders),
          } as MessageEvent),
      ),
    );
  }

  private async getOrdersForSSE(orderIds: string[]) {
    let queryBuilder = this.orderRepository.createQueryBuilder(this.alias);

    queryBuilder = this.prepareBuilderSelect(queryBuilder);

    queryBuilder
      .where('order.id IN (:...orderIds)', {
        orderIds: [null, ...orderIds],
      })
      .andWhere('order.deleted_at IS NULL');

    return await queryBuilder.getRawMany();
  }

  private prepareBuilderSelect(queryBuilder: any) {
    queryBuilder
      .innerJoin('order.product', 'product')
      .innerJoin('product.category', 'category')
      .innerJoin('order.reservation', 'reservation')
      .innerJoin('reservation.user', 'user')
      .innerJoin('reservation.waiter', 'waiter')
      .innerJoin('reservation.tables', 'tables')
      .innerJoin('tables.space', 'space')
      .select([
        'reservation.id as reservationId',
        'user.username as clientName',
        'waiter.username as waiterName',
        `GROUP_CONCAT(
          tables.table_name ORDER BY tables.table_name ASC SEPARATOR ','
        ) as tableName`,
        'MAX(space.name) as spaceName',
        `JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', order.id,
            'createdAt', order.created_at,
            'updatedAt', order.updated_at,
            'deletedAt', order.deleted_at,
            'title', order.title,
            'quantity', order.quantity,
            'status', order.status,
            'productId', order.product_id,
            'price', order.price,
            'isPreorder', order.is_preorder,
            'creationNotice', order.creation_notice,
            'deletionNotice', order.deletion_notice,
            'serviceType', order.service_type,
            'courseType', order.course_type,
            'doneness', order.doneness,
            'productName', product.title,
            'preparationZone', product.preparation_zone,
            'preparationTime', product.preparation_time,
            'categoryName', category.name,
            'readyAt', order.ready_at
          )
        ) as orders`
      ])
      .groupBy('reservation.id')
      .addGroupBy('user.username')
      .addGroupBy('waiter.username');

    return queryBuilder;
  }

  async completeOrdersByReservationId(reservationId: string): Promise<void> {
    try {
      console.log('Completing orders for reservation:', reservationId);
      
      // First find the orders that need to be updated
      const orders = await this.orderRepository.find({
        where: {
          reservationId,
          deletedAt: null,
          status: Not(In([OrderStatus.COMPLETED, OrderStatus.CANCELLED]))
        },
        select: ['id']  // Only select IDs for efficiency
      });

      if (orders.length === 0) {
        console.log('No active orders found for reservation:', reservationId);
        return;
      }

      const orderIds = orders.map(order => order.id);
      console.log(`Found ${orderIds.length} orders to complete`);

      // Update the orders
      await this.orderRepository.update(
        {
          id: In(orderIds)
        },
        {
          status: OrderStatus.COMPLETED,
          updatedAt: new Date()
        }
      );

      // Send SSE notifications
      const sseOrders = await this.getOrdersForSSE(orderIds);
      this.orderSubject.next(sseOrders);

      console.log(`Successfully completed ${orderIds.length} orders for reservation:`, reservationId);
    } catch (err) {
      console.error('Error completing orders for reservation:', err);
      throw new HttpException(
        'Failed to complete reservation orders',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
