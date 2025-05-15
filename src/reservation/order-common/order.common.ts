import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateOrderDto } from '../dto/createOrder.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { EntityManager, In, Repository } from 'typeorm';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../enums/orderStatus.enum';
import { PlanHistoryService } from '@src/plan/services/planHistory.service';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Product } from '@src/product/entities/product.entity';
import { ProductIngredient } from '@src/ingredient/entities/productIngredient.entity';
import { Reservation } from '../entities/reservation.entity';
import { Role } from '@src/user/enums/roles.enum';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { Stock } from '@src/stock/entities/stock.entity';
import { Unit } from '@src/stock/enums/unit.enum';
import { UpdateOrderDto } from '../dto/updateOrder.dto';

@Injectable()
export class OrderCommon {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,

    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,

    private readonly planHistoryService: PlanHistoryService,
  ) {}

  async processPlanCreate(
    user: AuthUser,
    createOrderItems: CreateOrderDto[],
    reservation: Reservation,
  ) {
    let alreadyCreatedOrders = [];
    try {
      const { type: planType } =
        user.role !== Role.USER
          ? await this.planHistoryService.getCurrentPlan(
              user.id,
              reservation.restaurantId,
            )
          : null;
      const productIds = createOrderItems.map((item) => item.productId);
      const products = await this.fetchProducts(productIds);

      const orders = createOrderItems.map((createOrderItem) => ({
        title: products.find((p) => p.id === createOrderItem.productId)?.title,
        quantity: createOrderItem.quantity,
        productId: createOrderItem.productId,
        price:
          products.find((p) => p.id === createOrderItem.productId)?.price *
          createOrderItem.quantity,
        reservationId: reservation.id,
        product: products.find(
          (product) => product.id === createOrderItem.productId,
        ),
        status: OrderStatus.PREPARING,
        courseType: createOrderItem.courseType,
        serviceType: createOrderItem.serviceType,
        creationNotice: createOrderItem.creationNotice || null,
        doneness: createOrderItem.doneness || null,
        isPreorder: createOrderItem.isPreorder || false
      }));

      alreadyCreatedOrders = await this.orderRepository.save(orders);

      const stockItemsMap = (
        await this.stockRepository.find({
          where: {
            title: In(
              products.flatMap((product) =>
                product.productIngredients.map(
                  (ingredient) => ingredient.ingredient.name,
                ),
              ),
            ),
            deletedAt: null,
          },
        })
      ).reduce((map, item) => ({ ...map, [item.title]: item }), {});

      if (user.role === Role.USER || planType === PlanType.PRO) {
        try {
          await this.stockRepository.manager.transaction(
            async (transactionalEntityManager) => {
              const updatePromises = createOrderItems.map(
                async (createOrderItem) => {
                  const product = products.find(
                    (p) => p.id === createOrderItem.productId,
                  );

                  if (!product) {
                    throw new HttpException(
                      ERROR_MESSAGES.productNotFound,
                      HttpStatus.NOT_FOUND,
                    );
                  }

                  const stockItemsToUpdate = await Promise.all(
                    product.productIngredients.map(
                      async (productIngredient) => {
                        const stockItem =
                          stockItemsMap[productIngredient.ingredient.name];

                        if (!stockItem) {
                          throw new HttpException(
                            ERROR_MESSAGES.stockNotFound,
                            HttpStatus.NOT_FOUND,
                          );
                        }

                        const ingredientQuantity =
                          productIngredient.quantity * createOrderItem.quantity;
                        const updatedStockVolume =
                          convertToGrams(stockItem) - ingredientQuantity;

                        if (updatedStockVolume < 0) {
                          throw new HttpException(
                            ERROR_MESSAGES.productIngredintNotInStock,
                            HttpStatus.BAD_REQUEST,
                          );
                        }

                        stockItem.volume = convertToOriginalUnit(
                          updatedStockVolume,
                          stockItem.unit,
                          stockItem.pcVolume,
                          stockItem.pcUnit,
                        );

                        return stockItem;
                      },
                    ),
                  );

                  return stockItemsToUpdate;
                },
              );

              const allStockItemsToUpdate = (
                await Promise.all(updatePromises)
              ).flat();
              await transactionalEntityManager.save(allStockItemsToUpdate);
            },
          );
        } catch (transactionError) {
          throw new HttpException(
            transactionError.message,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      return orders;
    } catch (error) {
      return handleError(user, error, alreadyCreatedOrders);
    }
  }

  async processPlanUpdate(
    user: AuthUser,
    order: Order,
    product: Product,
    updateOrderDto: UpdateOrderDto,
  ) {
    let alreadyUpdatedOrders: Order;

    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id: order.reservationId, deletedAt: null },
      });
      const { type: planType } =
        user.role !== Role.USER
          ? await this.planHistoryService.getCurrentPlan(
              user.id,
              reservation.restaurantId,
            )
          : null;

      await this.orderRepository.update(order.id, updateOrderDto);

      if (user.role === Role.USER || planType === PlanType.PRO) {
        try {
          await this.stockRepository.manager.transaction(
            async (transactionalEntityManager) => {
              const orderQuantityDifference =
                updateOrderDto.quantity - order.quantity;

              const stockItemsToUpdate = [];

              product.productIngredients.map(async (ingredient) => {
                await this.updatePlanUpdateStockVolume(
                  ingredient,
                  updateOrderDto,
                  order,
                  orderQuantityDifference,
                  transactionalEntityManager,
                  stockItemsToUpdate,
                );
              });

              await transactionalEntityManager.save(stockItemsToUpdate);
            },
          );
        } catch (transactionError) {
          throw new HttpException(
            transactionError.message,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const updatedOrder = await this.orderRepository.findOne({
        where: { id: order.id, deletedAt: null },
      });
      alreadyUpdatedOrders = updatedOrder;

      if (!updatedOrder) {
        throw new HttpException(
          ERROR_MESSAGES.orderNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      return updatedOrder;
    } catch (error) {
      return handleError(user, error, alreadyUpdatedOrders);
    }
  }

  async processPlanDelete(
    user: AuthUser,
    orders: Order[],
    reservationId: string,
  ) {
    try {
      const reservation = await this.reservationRepository.findOne({
        where: { id: reservationId, deletedAt: null },
      });
      const { type: planType } =
        user.role !== Role.USER
          ? await this.planHistoryService.getCurrentPlan(
              user.id,
              reservation.restaurantId,
            )
          : null;

      if (user.role === Role.USER || planType === PlanType.PRO) {
        const productIds = orders.map((order) => order.productId);
        const products = await this.fetchProducts(productIds);

        try {
          await this.stockRepository.manager.transaction(
            async (transactionalEntityManager) => {
              const updatePromises = products.map(async (product) => {
                return Promise.all(
                  product.productIngredients.map(async (productIngredient) => {
                    const stockItem = await this.stockRepository.findOne({
                      where: {
                        title: productIngredient.ingredient.name,
                        deletedAt: null,
                      },
                    });

                    if (stockItem) {
                      const order = orders.find(
                        (order) => order.productId === product.id,
                      );
                      const ingredientQuantity =
                        productIngredient.quantity * order.quantity;
                      const updatedStockVolume =
                        convertToGrams(stockItem) + ingredientQuantity;

                      stockItem.volume = convertToOriginalUnit(
                        updatedStockVolume,
                        stockItem.unit,
                        stockItem.pcVolume,
                        stockItem.pcUnit,
                      );

                      return stockItem;
                    } else {
                      return null;
                    }
                  }),
                );
              });

              const allStockItemsToUpdate = (await Promise.all(updatePromises))
                .flat()
                .filter((item) => item !== null);
              if (allStockItemsToUpdate.length > 0) {
                await transactionalEntityManager.save(allStockItemsToUpdate);
              }
            },
          );
        } catch (error) {}
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    } finally {
      await this.orderRepository.manager.transaction(async (transaction) => {
        await transaction.softDelete(Order, orders);
      });
    }
  }

  async updatePlanUpdateStockVolume(
    ingredient: ProductIngredient,
    updateOrderDto: UpdateOrderDto,
    order: Order,
    orderQuantityDifference: any,
    transaction: EntityManager,
    stockItemsToUpdate: Stock[],
  ) {
    const stockItem = await transaction.findOne(Stock, {
      where: {
        title: ingredient.ingredient.name,
        deletedAt: null,
      },
    });

    if (!stockItem) {
      throw new HttpException(
        ERROR_MESSAGES.stockNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const ingredientQuantity =
      ingredient.quantity * Math.abs(updateOrderDto.quantity - order.quantity);
    const stockVolume = convertToGrams(stockItem);

    if (orderQuantityDifference > 0 && stockVolume < ingredientQuantity) {
      throw new HttpException(
        ERROR_MESSAGES.productIngredintNotInStock,
        HttpStatus.BAD_REQUEST,
      );
    }

    stockItem.volume = convertToOriginalUnit(
      orderQuantityDifference > 0
        ? stockVolume - ingredientQuantity
        : stockVolume + ingredientQuantity,
      stockItem.unit,
      stockItem.pcVolume,
      stockItem.pcUnit,
    );

    stockItemsToUpdate.push(stockItem);
  }

  async fetchProducts(productIds: string[]) {
    const products = await this.productRepository
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
      .where('product.id IN (:...productIds)', {
        productIds: [null, ...productIds],
      })
      .andWhere('product.deleted_at IS NULL')
      .getMany();

    return products;
  }
}

function handleError(user: AuthUser, error: any, returnValue: any) {
  if (
    user.role === Role.ADMIN ||
    user.role === StaffRole.WAITER ||
    user.role === StaffRole.HOSTESS ||
    user.role === StaffRole.SUPER_HOSTESS
  ) {
    throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
  } else {
    return returnValue;
  }
}

function convertToGrams(stockItem: Stock) {
  switch (stockItem.unit) {
    case Unit.LITERS:
      return stockItem.volume * 1000;
    case Unit.KG:
      return stockItem.volume * 1000;
    case Unit.GRAMS:
      return stockItem.volume;
    case Unit.MILLILITERS:
      return stockItem.volume;
    case Unit.PCS:
      if (stockItem.pcUnit === Unit.LITERS || stockItem.pcUnit === Unit.KG) {
        return stockItem.volume * stockItem.pcVolume * 1000;
      } else {
        return stockItem.volume * stockItem.pcVolume;
      }
    default:
      return stockItem.volume;
  }
}

function convertToOriginalUnit(
  volume: any,
  originalUnit: Unit,
  pcVolume: any,
  pcUnit: Unit,
) {
  switch (originalUnit) {
    case Unit.LITERS:
      return volume / 1000;
    case Unit.KG:
      return volume / 1000;
    case Unit.GRAMS:
      return volume;
    case Unit.MILLILITERS:
      return volume;
    case Unit.PCS:
      if (pcUnit === Unit.LITERS || pcUnit === Unit.KG) {
        return parseFloat((volume / pcVolume / 1000).toFixed(2));
      } else {
        return parseFloat((volume / pcVolume).toFixed(2));
      }
    default:
      return volume;
  }
}
