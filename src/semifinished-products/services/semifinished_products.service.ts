import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ingredient } from '@src/ingredient/entities/ingredient.entity';
import { Repository } from 'typeorm';
import { Product } from '@src/product/entities/product.entity';
import { ProductIngredient } from '@src/ingredient/entities/productIngredient.entity';
import { SemifinishedProduct } from '@src/semifinished-products/entities/semifinished-product.entity';
import { plainToClass } from 'class-transformer';
import { CreateSemifinishedProductDto } from '@src/semifinished-products/dto/create-semifinished-product.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import {  toTitleCase } from '@src/common/utils';
import { UpdateSemifinishedProductDto } from '@src/semifinished-products/dto/update-semifinished-product.dto';

@Injectable()
export class SemifinishedProductsService {

  private alias = 'semifinished_products';

  constructor(
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductIngredient)
    private readonly productIngredientRepository: Repository<ProductIngredient>,
    @InjectRepository(SemifinishedProduct)
    private readonly semifinishedProductsRepository: Repository<SemifinishedProduct>,
  ) {

  }

  async create(restaurantId: string,
               createSemifinishedProductDto: CreateSemifinishedProductDto): Promise<SemifinishedProduct> {
    try {
      const { ingredients, name } = createSemifinishedProductDto;

      const existingSemifinishedProduct = await this.semifinishedProductsRepository.findOne({
        where: { name, restaurantId, deletedAt: null },
      });

      if (existingSemifinishedProduct) {
        throw new HttpException(
          ERROR_MESSAGES.semifinishedProductAlreadyExists.replace(':title', name),
          HttpStatus.BAD_REQUEST,
        );
      }

      const semifinishedProduct = plainToClass(SemifinishedProduct, createSemifinishedProductDto);
      semifinishedProduct.restaurantId = restaurantId;
      semifinishedProduct.name = toTitleCase(name);
      if (ingredients && ingredients.length > 0) {
        const uniqueIngredientNames = new Set<string>();
        let totalWeight = 0;

        const semifinishedProductIngredients = await Promise.all(
          ingredients.map(async (ingredientDto) => {
            if (!uniqueIngredientNames.has(ingredientDto.name)) {
              uniqueIngredientNames.add(ingredientDto.name);
            } else {
              throw new HttpException(
                ERROR_MESSAGES.ingredientRepeated.replace(
                  ':name',
                  ingredientDto.name,
                ),
                HttpStatus.BAD_REQUEST,
              );
            }

            let ingredient = await this.ingredientRepository.findOne({
              where: { name: ingredientDto.name, deletedAt: null },
            });
            if (!ingredient) {
              ingredient = new Ingredient();
              ingredient.name = toTitleCase(ingredientDto.name);
              await this.ingredientRepository.save(ingredient);
            }

            const productIngredient = new ProductIngredient();
            productIngredient.ingredient = ingredient;
            productIngredient.quantity = ingredientDto.quantity;

            await this.productIngredientRepository.save(productIngredient);
            // needs weight_formula integration

            totalWeight += ingredientDto.quantity;
            return productIngredient;
          }),
        );

        semifinishedProduct.weight = totalWeight;
        semifinishedProduct.productIngredients = semifinishedProductIngredients;
      }

      const result = await this.semifinishedProductsRepository.save(semifinishedProduct);

      return result;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAllByRestaurantId(restaurantId: string, user: AuthUser) {
    const semifinishedProducts = await this.semifinishedProductsRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(
        'semifinishedProduct.productIngredients',
        'productIngredients',
        'productIngredients.deleted_at IS NULL',
      )
      .leftJoinAndSelect(
        'productIngredients.ingredient',
        'ingredient',
        'ingredient.deleted_at IS NULL',
      )
      .where('product.restaurant_id = :restaurantId', {
        restaurantId: restaurantId || user.restaurantId,
      })
      .andWhere('product.deleted_at IS NULL')
      .getMany();

    if (!semifinishedProducts) {
      throw new HttpException(
        ERROR_MESSAGES.productNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const filteredSemifinishedProducts = this.getFilteredSemifinishedProducts(semifinishedProducts);

    return filteredSemifinishedProducts;
  }

  async getById(semifinishedProductId: string): Promise<SemifinishedProduct> {
    const semifinishedProduct = await this.semifinishedProductsRepository.findOneBy({
      id: semifinishedProductId,
      deletedAt: null,
    });

    if (!semifinishedProduct) {
      throw new HttpException(
        ERROR_MESSAGES.semifinishedProductNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return semifinishedProduct;
  }

  async update(
    semifinishedProductId: string,
    updateSemifinishedProductDto: UpdateSemifinishedProductDto,
  ): Promise<any> {
    try {
      const semifinishedProduct = await this.ingredientRepository.findOneBy({
        id: semifinishedProductId,
        deletedAt: null,
      });

      if (!semifinishedProduct) {
        throw new HttpException(
          ERROR_MESSAGES.ingredientNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.semifinishedProductsRepository.update(semifinishedProductId, updateSemifinishedProductDto);

      return { ...semifinishedProduct, ...updateSemifinishedProductDto };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(
    semifinishedProductId: string) {

    try {
      const semifinishedProduct = await this.semifinishedProductsRepository.findOne({
        where: { id: semifinishedProductId, deletedAt: null },
      });

      if (!semifinishedProduct) {
        throw new HttpException(
          ERROR_MESSAGES.semifinishedProductNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.semifinishedProductsRepository.softDelete(semifinishedProduct.id);
      return { deleted: true };
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }


  private getFilteredSemifinishedProduct(semifinishedProduct: SemifinishedProduct) {
    const filteredSemifinishedProduct = {
      id: semifinishedProduct.id,
      name: semifinishedProduct.name,
      weight: semifinishedProduct.weight,
      productIngredients: semifinishedProduct.productIngredients.map((ingredient) => ({
        id: ingredient.id,
        quantity: ingredient.quantity,
        ingredient: {
          id: ingredient.ingredient.id,
          name: ingredient.ingredient.name,
        },
      })),
    };

    return filteredSemifinishedProduct;
  }

  private getFilteredSemifinishedProducts(
    semifinishedProducts: SemifinishedProduct[]) {
    const filteredSemifinishedProducts = semifinishedProducts.map((semifinishedProduct) =>
      this.getFilteredSemifinishedProduct(semifinishedProduct),
    );

    return filteredSemifinishedProducts;
  }

}
