import * as dotenv from 'dotenv';
import prettify from '@src/common/prettify';
import sendSuplierTemplate from '@src/common/email/sendSuplierEmail';
import validateEmail from '@src/common/email/validate/email.validate';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { Context, Telegraf } from 'telegraf';
import { CreateOrderForSuplierDto } from '../dto/create_suplier_order.dto';
import { CreateStockDto } from '../dto/create_stock.dto';
import { Document } from '@src/document/entities/document.entity';
import { ERROR_MESSAGES } from '@src/constants';
import { EmailService } from '@src/common/email/form/email.form';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectBot } from 'nestjs-telegraf';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { SentenceBuilder } from '@src/telegram-connectionn/common.sentences';
import { Stock } from '../entities/stock.entity';
import { StockCategory } from '../enums/stock_category.enum';
import { Suplier } from '@src/suplier/entities/suplier.entity';
import { Unit } from '../enums/unit.enum';
import { UpdateStockDto } from '../dto/update_stock.dto';
import { getPaginated } from '@src/common/pagination';
import { plainToClass } from 'class-transformer';

dotenv.config();

@Injectable()
export class StockService {
  private alias = 'stock';

  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,

    @InjectRepository(Suplier)
    private readonly suplierRepository: Repository<Suplier>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,

    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,

    @InjectBot() private bot: Telegraf<Context>,

    private readonly emailService: EmailService,
  ) {}

  async create(
    user: AuthUser,
    suplierId: string,
    createStockDto: CreateStockDto,
  ) {
    try {
      const suplier = await this.suplierRepository.findOne({
        where: { id: suplierId, deletedAt: null },
      });

      if (!suplier) {
        throw new HttpException(
          ERROR_MESSAGES.suplierNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (
        createStockDto.unit === Unit.PCS &&
        (createStockDto.pcVolume === null ||
          createStockDto.pcVolume === undefined ||
          createStockDto.pcUnit === null ||
          createStockDto.pcUnit === undefined)
      ) {
        throw new HttpException(
          ERROR_MESSAGES.pieceVolumeMustBeProvided,
          HttpStatus.BAD_REQUEST,
        );
      }

      const stock = plainToClass(Stock, createStockDto);

      stock.suplierId = suplierId;
      stock.suplierName = suplier.name;
      stock.restaurantId = user.restaurantId;

      const tvaSum = (stock.tvaType / 100) * createStockDto.priceWithoutTva;
      stock.priceWithTva = createStockDto.priceWithoutTva + tvaSum;

      const result = await this.stockRepository.save(stock);

      suplier.lastOrder = new Date();
      suplier.orderVolume += stock.priceWithTva;
      await this.suplierRepository.save(suplier);

      return result;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async createOrderToSuplierEmail(
    user: AuthUser,
    suplierId: string,
    createOrderDto: CreateOrderForSuplierDto,
    i18n: I18nContext,
  ) {
    const suplier = await this.suplierRepository.findOne({
      where: { id: suplierId, deletedAt: null },
    });

    if (!suplier) {
      throw new HttpException(
        ERROR_MESSAGES.suplierNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const restaurant = await this.restaurantRepository.findOne({
      where: { id: user.restaurantId, deletedAt: null },
    });

    if (!restaurant) {
      throw new HttpException(
        ERROR_MESSAGES.restaurantNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const productLines = `<b>${createOrderDto.productTitle}</b>, în cantitate de <b>${createOrderDto.productVolume}</b> KILOGRAME/LITRI/UNITĂŢI`;

    const options = await sendSuplierTemplate(
      {
        email: suplier.email,
        suplierName: suplier.name,
        adminName: user.username,
        restaurantName: restaurant.name,
        productLines,
        additionalProperties: createOrderDto.message
          ? createOrderDto.message
          : '',
        suplierEmail: restaurant.email,
      },
      i18n,
    );

    await this.emailService.sendMail(options);
  }

  async createOrderToSuplierTelegram(
    user: AuthUser,
    suplierId: string,
    createOrderDto: CreateOrderForSuplierDto,
  ) {
    try {
      const suplier = await this.suplierRepository.findOne({
        where: { id: suplierId, deletedAt: null },
      });

      if (!suplier) {
        throw new HttpException(
          ERROR_MESSAGES.suplierNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const restaurant = await this.restaurantRepository.findOne({
        where: { id: user.restaurantId, deletedAt: null },
      });

      if (!restaurant) {
        throw new HttpException(
          ERROR_MESSAGES.restaurantNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const email = suplier.email;
      validateEmail(email);

      const senderEmail = restaurant.email;
      validateEmail(senderEmail);

      const message = SentenceBuilder.orderMessage(
        restaurant.name,
        restaurant.address,
        suplier.name,
        createOrderDto.productTitle,
        createOrderDto.productVolume,
        restaurant.email,
        createOrderDto.message,
      );

      try {
        await this.bot.telegram.sendMessage(suplier.telegramId, message);
      } catch (error) {
        throw new HttpException(
          ERROR_MESSAGES.failedTelegramNotification,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getById(id: string) {
    const stock = await this.stockRepository.findOne({
      where: { id: id, deletedAt: null },
    });

    if (!stock) {
      throw new HttpException(
        ERROR_MESSAGES.stockNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return stock;
  }

  async getStockWithSuplier(stockId: string) {
    const stock = await this.stockRepository.findOne({
      where: { id: stockId, deletedAt: null },
    });

    if (!stock) {
      throw new HttpException(
        ERROR_MESSAGES.stockNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const suplier = await this.suplierRepository.findOne({
      where: { id: stock.suplierId, deletedAt: null },
    });

    if (!suplier) {
      throw new HttpException(
        ERROR_MESSAGES.suplierNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const document = await this.documentRepository.find({
      where: { itemId: stock.id, deletedAt: null },
    });

    const result = {
      stockName: stock.title,
      category: stock.category,
      expirationDate: stock.expirationDate,
      volume: +stock.volume,
      reorderLimit: stock.reorderLimit,
      unit: stock.unit,
      tvaType: stock.tvaType,
      priceWithoutTva: stock.priceWithoutTva,
      priceWithTva: stock.priceWithTva,
      supplierName: suplier.name,
      idno: suplier.idno,
      vat: suplier.vatNumber,
      iban: suplier.iban,
      bankName: suplier.bankName,
      email: suplier.email,
      phoneNumber: suplier.phoneNumber,
      document: document ? document : '',
    };

    return result;
  }

  async getAll(filter: IFilter, user: AuthUser) {
    const { limit, skip, all } = filter;
    const columns = ['title', 'category', 'suplierName', 'createdAt'];

    try {
      const queryBuilder = this.stockRepository.createQueryBuilder(this.alias);

      queryBuilder
        .where('stock.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('stock.deleted_at IS NULL');

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

      const stocks = await queryBuilder.getMany();
      const countStocks = await queryBuilder.getCount();

      const results = getPaginated({
        categoryList: StockCategory,
        data: stocks,
        count: countStocks,
        skip,
        limit,
        all,
      });

      const resultWithCategories = {
        ...results,
        categories: Object.values(StockCategory),
      };

      return prettify(resultWithCategories);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async update(
    user: AuthUser,
    stockId: string,
    updateStockDto: UpdateStockDto,
  ) {
    try {
      const stock = await this.stockRepository.findOne({
        where: { id: stockId, deletedAt: null },
      });

      if (!stock) {
        throw new HttpException(
          ERROR_MESSAGES.stockNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (stock.restaurantId !== user.restaurantId) {
        throw new HttpException(
          ERROR_MESSAGES.suplierCantBeUpdated,
          HttpStatus.BAD_REQUEST,
        );
      }

      const tvaType = updateStockDto.tvaType || stock.tvaType;
      const priceWithoutTva =
        updateStockDto.priceWithoutTva || stock.priceWithoutTva;

      const tvaSum = (tvaType / 100) * priceWithoutTva;
      const updatedPriceWithTva = priceWithoutTva + tvaSum;

      if (
        updateStockDto.unit === Unit.PCS &&
        (updateStockDto.pcVolume === null ||
          updateStockDto.pcVolume === undefined)
      ) {
        throw new HttpException(
          ERROR_MESSAGES.pieceVolumeMustBeProvided,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (updateStockDto.suplierName) {
        const suplier = await this.suplierRepository.findOne({
          where: { name: updateStockDto.suplierName, deletedAt: null },
        });

        updateStockDto.suplierId = suplier.id;
      }

      const updatedStock = this.stockRepository.create({
        ...stock,
        ...updateStockDto,
        priceWithTva: updatedPriceWithTva,
      });

      await this.stockRepository.save(updatedStock);

      return updatedStock;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(stockId: string) {
    const stock = await this.stockRepository.findOne({
      where: {
        id: stockId,
        deletedAt: null,
      },
    });

    if (!stock) {
      throw new HttpException(
        ERROR_MESSAGES.stockNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.stockRepository.softDelete(stockId);

    return { deleted: true };
  }
}
