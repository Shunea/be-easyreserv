import prettify from '@src/common/prettify';
import { CreateIngredientDto } from '../dto/createIngredient.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { Ingredient } from '../entities/ingredient.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '@src/product/entities/product.entity';
import { ProductIngredient } from '../entities/productIngredient.entity';
import { Repository } from 'typeorm';
import { UpdateIngredientDto } from '@src/ingredient/dto/updateIngredient.dto';
import { getPaginated } from '@src/common/pagination';
import { plainToClass } from 'class-transformer';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';

@Injectable()
export class IngredientService {
  private alias = 'ingredient';

  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductIngredient)
    private readonly productIngredientRepository: Repository<ProductIngredient>,
  ) {}

  async getAll(filter: IFilter, user: AuthUser) {
    const { limit, skip, all } = filter;
    const searchColumns = ['name'];
    try {
      const queryBuilder = this.ingredientRepository.createQueryBuilder(
        this.alias,
      );

      queryBuilder
        .innerJoin(
          'ingredient.productIngredients',
          'productIngredients',
          'productIngredients.deleted_at IS NULL',
        )
        .innerJoin(
          'productIngredients.product',
          'product',
          'product.deleted_at IS NULL',
        )
        .where('ingredient.deleted_at IS NULL')
        .andWhere('product.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        });

      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.alias,
        'created_at',
        filter,
      );

      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySearch(queryBuilder, this.alias, filter, searchColumns);

      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const ingredients = await queryBuilder.getMany();
      const ingredientsCount = await queryBuilder.getCount();

      const simplifiedIngredients = ingredients.map(({ id, name }) => ({
        id,
        name,
      }));

      const result = getPaginated({
        data: simplifiedIngredients,
        count: ingredientsCount,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getById(ingredientId: string): Promise<Ingredient> {
    const ingredient = await this.ingredientRepository.findOneBy({
      id: ingredientId,
      deletedAt: null,
    });

    if (!ingredient) {
      throw new HttpException(
        ERROR_MESSAGES.ingredientNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return ingredient;
  }

  async create(createIngredientDto: CreateIngredientDto): Promise<Ingredient> {
    try {
      const ingredient = plainToClass(Ingredient, createIngredientDto);
      return await this.ingredientRepository.save(ingredient);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async update(
    ingredientId: string,
    updateIngredientDto: UpdateIngredientDto,
  ): Promise<any> {
    try {
      const ingredient = await this.ingredientRepository.findOneBy({
        id: ingredientId,
        deletedAt: null,
      });

      if (!ingredient) {
        throw new HttpException(
          ERROR_MESSAGES.ingredientNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.ingredientRepository.update(ingredientId, updateIngredientDto);

      return { ...ingredient, ...updateIngredientDto };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(ingredientId: string) {
    const ingredient = await this.ingredientRepository.findOneBy({
      id: ingredientId,
      deletedAt: null,
    });

    if (!ingredient) {
      throw new HttpException(
        ERROR_MESSAGES.ingredientNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.ingredientRepository
      .createQueryBuilder(this.alias)
      .delete()
      .from(Ingredient)
      .where('ingredient.id = :ingredientId', { ingredientId })
      .execute();

    return { deleted: true };
  }

  async deleteProductIngredient(
    productId: string,
    productIngredientId: string,
  ): Promise<any> {
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId, deletedAt: null },
      });

      if (!product) {
        throw new HttpException(
          ERROR_MESSAGES.productNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const productIngredient = await this.productIngredientRepository.findOne({
        where: { id: productIngredientId, deletedAt: null },
      });

      if (!productIngredient) {
        throw new HttpException(
          ERROR_MESSAGES.productIngredientNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      product.weight -= productIngredient.quantity;
      await this.productRepository.save(product);

      await this.productIngredientRepository.softDelete(productIngredient.id);
      return { deleted: true };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
