import { HttpException, HttpStatus } from '@nestjs/common';
import { ERROR_MESSAGES } from '@src/constants';
import { Product } from '@src/product/entities/product.entity';
import { title } from 'process';

export class ProductsStatsService {
  calculateStatsForDate(products: Product[]) {
    const stats = {
      total: 0,
      available: 0,
    };

    if (!products) {
      throw new HttpException(
        ERROR_MESSAGES.productNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    products.forEach((product) => {
      stats.total++;
      if (product.isAvailable) {
        stats.available++;
      }
    });

    return stats;
  }

  getReports(products: Product[]) {
    let productsStatsForRestaurant = {};
    let productsDataForRestaurant = {};

    const stats = this.calculateStatsForDate(products);
    productsStatsForRestaurant = stats;

    productsDataForRestaurant = products.map((product) => ({
      id: product.id,
      title: product.title,
      isAvailable: product.isAvailable,
    }));

    return {
      productsStatsForRestaurant,
      productsDataForRestaurant,
    };
  }
}
