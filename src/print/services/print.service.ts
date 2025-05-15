import * as dotenv from 'dotenv';
import * as moment from 'moment';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '@src/reservation/entities/order.entity';
import { PrintDto } from '../dto/print.dto';
import { Repository } from 'typeorm';
import { PreparationZones } from '@src/product/enums/preparation-zones.enum';

const escpos = require('escpos');

escpos.USB = require('escpos-usb');
// escpos.Network = require('escpos-network');

dotenv.config();

@Injectable()
export class PrintService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {
  }

  async getPrint(reservationId: string, response: any) {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.product', 'product')
      .leftJoinAndSelect('product.restaurant', 'restaurant')
      .leftJoinAndSelect('order.reservation', 'reservation')
      .leftJoinAndSelect('reservation.tables', 'tables')
      .leftJoinAndSelect('reservation.waiter', 'waiter')
      .where('order.reservationId = :reservationId', { reservationId })
      .select(['order.id', 'order.title', 'order.quantity', 'order.price'])
      .addSelect(['reservation.id', 'reservation.status'])
      .addSelect(['product.id', 'product.title', 'product.preparation_zone'])
      .addSelect(['restaurant.id', 'restaurant.name', 'restaurant.address', 'restaurant.phoneNumber'])
      // .addSelect(['tables.id', 'tables.tableName'])
      .addSelect('GROUP_CONCAT(tables.tableName SEPARATOR \', \')', 'tablesNames')
      .addSelect(['waiter.id', 'waiter.username'])
      .groupBy('order.id');

    try {
      const orders = await query.getRawMany();

      if (!orders.length) {
        return response.status(HttpStatus.NOT_FOUND).json({
          message: ERROR_MESSAGES.orderNotFound,
        });
      }

      const restaurantName = orders[0].restaurant_name;
      const restaurantAddress = orders[0].restaurant_address;
      const restaurantPhone = orders[0].restaurant_phoneNumber;
      const waiterName = orders[0].waiter_username;
      const total = orders.reduce((acc, order) => acc + +order.order_price, 0);

      return response.status(HttpStatus.OK).json({
        orders: orders.map(order => ({
          title: order.order_title,
          quantity: order.order_quantity,
          price: +order.order_price,
        })),
        restaurantName,
        restaurantAddress,
        restaurantPhone,
        waiterName,
        total,
      });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getChefPrint(reservationId: string, response: any) {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.product', 'product')
      .leftJoinAndSelect('product.restaurant', 'restaurant')
      .leftJoinAndSelect('order.reservation', 'reservation')
      .leftJoinAndSelect('reservation.tables', 'tables')
      .leftJoinAndSelect('reservation.waiter', 'waiter')
      .where('order.reservationId = :reservationId', { reservationId })
      .select(['order.id', 'order.title', 'order.quantity'])
      .addSelect(['reservation.id', 'reservation.status'])
      .addSelect(['product.id', 'product.title', 'product.preparation_zone'])
      .addSelect(['restaurant.id', 'restaurant.name', 'restaurant.address', 'restaurant.phoneNumber'])
      // .addSelect(['tables.id', 'tables.tableName'])
      .addSelect('GROUP_CONCAT(tables.tableName SEPARATOR \', \')', 'tablesNames')
      .addSelect(['waiter.id', 'waiter.username'])
      .groupBy('order.id');
    try {
      const orders = await query.getRawMany();

      if (!orders.length) {
        return response.status(HttpStatus.NOT_FOUND).json({
          message: ERROR_MESSAGES.orderNotFound,
        });
      }

      const restaurantName = orders[0].restaurant_name;
      const restaurantAddress = orders[0].restaurant_address;
      const restaurantPhone = orders[0].restaurant_phoneNumber;
      const waiterName = orders[0].waiter_username;

      return response.status(HttpStatus.OK).json({
        orders: orders
          .filter(order => order.preparation_zone !== PreparationZones.Bar)
          .map(order => ({
            title: order.order_title,
            quantity: order.order_quantity,
          })),
        restaurantName,
        restaurantAddress,
        restaurantPhone,
        waiterName,
      });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getBartenderPrint(reservationId: string, response: any) {
    const query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.product', 'product')
      .leftJoinAndSelect('product.restaurant', 'restaurant')
      .leftJoinAndSelect('order.reservation', 'reservation')
      .leftJoinAndSelect('reservation.tables', 'tables')
      .leftJoinAndSelect('reservation.waiter', 'waiter')
      .where('order.reservationId = :reservationId', { reservationId })
      .select(['order.id', 'order.title', 'order.quantity', 'order.price'])
      .addSelect(['reservation.id', 'reservation.status'])
      .addSelect(['product.id', 'product.title', 'product.preparation_zone'])
      .addSelect(['restaurant.id', 'restaurant.name', 'restaurant.address', 'restaurant.phoneNumber'])
      // .addSelect(['tables.id', 'tables.tableName'])
      .addSelect('GROUP_CONCAT(tables.tableName SEPARATOR \', \')', 'tablesNames')
      .addSelect(['waiter.id', 'waiter.username'])
      .groupBy('order.id');
    try {
      const orders = await query.getRawMany();

      if (!orders.length) {
        return response.status(HttpStatus.NOT_FOUND).json({
          message: ERROR_MESSAGES.orderNotFound,
        });
      }

      const restaurantName = orders[0].restaurant_name;
      const restaurantAddress = orders[0].restaurant_address;
      const restaurantPhone = orders[0].restaurant_phoneNumber;
      const waiterName = orders[0].waiter_username;

      return response.status(HttpStatus.OK).json({
        orders: orders
          .filter(order => order.preparation_zone === PreparationZones.Bar)
          .map(order => ({
            title: order.order_title,
            quantity: order.order_quantity,
          })),
        restaurantName,
        restaurantAddress,
        restaurantPhone,
        waiterName,
      });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async print(body: PrintDto) {
    try {
      const { reservationId } = body;

      const device = new escpos.USB();
      // const device = new escpos.Network(
      // process.env.PRINTER_IP,
      //   parseInt(process.env.PRINTER_PORT, 10),
      // );

      const options = { encoding: process.env.PRINTER_ENCODING };
      const printer = new escpos.Printer(device, options);

      const orders = await this.orderRepository.find({
        where: { reservationId, deletedAt: null },
        select: ['id', 'title', 'quantity', 'price'],
        join: {
          alias: 'order',
          leftJoinAndSelect: {
            reservation: 'order.reservation',
            tables: 'reservation.tables',
            waiter: 'reservation.waiter',
            product: 'order.product',
            restaurant: 'product.restaurant',
          },
        },
      });

      await new Promise<void>((resolve, reject) => {
        device.open(async (error) => {
          if (error) {
            return reject(error);
          }

          try {
            device.write(Buffer.from([0x1b, 0x21, 0x00]));
            await this.printReceipt(printer, orders);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  private async printReceipt(printer: any, orders: Order[]): Promise<void> {
    if (orders && orders.length === 0) {
      return printer.close();
    }

    const reservation = orders[0].reservation;
    const restaurantName = orders[0].product.restaurant.name;
    const restaurantAddress = orders[0].product.restaurant.address;
    const restaurantPhone = orders[0].product.restaurant.phoneNumber;
    const total = orders.reduce((acc, order) => acc + +order.price, 0);

    printer
      .align('ct')
      .style('b')
      .text(restaurantName)
      .text(restaurantAddress)
      .text(restaurantPhone)
      .newLine()
      .text('NOTA DE PLATA')
      .newLine()
      .align('lt')
      .style('normal')
      .text(`Data: ${moment().format('DD.MM.YYYY HH:mm:ss')}`)
      .text(
        `Masa: ${reservation.tables
          .map(({ tableName }) => tableName)
          .sort()
          .join(',')}`,
      )
      .text(`Chelner: ${reservation.waiter.username}`)
      .newLine()
      .newLine();

    orders.forEach((order) => {
      printer.tableCustom([
        {
          text:
            order.title.length > 30
              ? `${order.title.substring(0, 30)}...`
              : order.title,
          align: 'LEFT',
          width: 0.7,
        },
        {
          text: `${(+order.price).toFixed(2)} lei`,
          align: 'RIGHT',
          width: 0.3,
        },
      ]);
      printer
        .align('lt')
        .text(`${order.quantity} x ${(+order.product.price).toFixed(2)} lei`);
    });

    printer
      .newLine()
      .style('b')
      .text(`TOTAL: ${(+total).toFixed(2)} lei`)
      .newLine()
      .newLine()
      .align('ct')
      .text('Solicitati bonul fiscal!')
      .text('VA MULTUMIM!')
      .newLine()
      .newLine()
      .cut()
      .close();
  }
}
