import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Stock } from '@src/stock/entities/stock.entity';
import { StockStatus } from '@src/stock/enums/stock_status.enum';

@Injectable()
export class StockCronjobService {
  private alias = 'stock';
  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}

  @Cron('0 0 */3 * * *')
  async updateStockStatus() {
    const stockItems = await this.stockRepository
      .createQueryBuilder('stock')
      .where('stock.volume - stock.reorderLimit <= :ratio', { ratio: 10 })
      .andWhere('stock.deleted_at IS NULL')
      .getMany();

    await Promise.all(
      stockItems.map(async (stockItem) => {
        const difference = stockItem.volume - stockItem.reorderLimit;

        if (stockItem.volume === 0) {
          stockItem.stockStatus = StockStatus.OUT_OF_STOCK;
        } else if (
          stockItem.volume > stockItem.reorderLimit &&
          difference <= 10
        ) {
          stockItem.stockStatus = StockStatus.NEAR_LOW_STOCK;
        } else if (stockItem.volume <= stockItem.reorderLimit) {
          stockItem.stockStatus = StockStatus.LOW_STOCK;
        }

        await this.stockRepository.save(stockItem);
      }),
    );
  }
}
