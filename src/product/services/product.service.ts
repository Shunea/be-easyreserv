import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { Category } from '@src/category/entities/category.entity';
import { CreateProductDto } from '../dto/createProduct.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Ingredient } from '@src/ingredient/entities/ingredient.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { ProductIngredient } from '@src/ingredient/entities/productIngredient.entity';
import { Repository } from 'typeorm';
import { UpdateProductDto } from '../dto/updateProduct.dto';
import { plainToClass } from 'class-transformer';
import { toTitleCase } from '@src/common/utils';

@Injectable()
export class ProductService {
  private alias = 'product';

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(ProductIngredient)
    private readonly productIngredientRepository: Repository<ProductIngredient>,
  ) {}

  async getAllByRestaurantId(restaurantId: string, user: AuthUser) {
    const products = await this.productRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(
        'product.category',
        'category',
        'category.deleted_at IS NULL',
      )
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
      .where('product.restaurant_id = :restaurantId', {
        restaurantId: restaurantId || user.restaurantId,
      })
      .andWhere('product.deleted_at IS NULL')
      .getMany();

    if (!products) {
      throw new HttpException(
        ERROR_MESSAGES.productNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const filteredProducts = this.getFilteredProducts(products);

    return filteredProducts;
  }

  async findByCategoryIdAndRestaurantId(
    categoryId: string,
    restaurantId: string,
  ): Promise<any> {
    const products = await this.productRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(
        'product.category',
        'category',
        'category.deleted_at IS NULL',
      )
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
      .where('product.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('product.category_id = :categoryId', { categoryId })
      .andWhere('product.deleted_at IS NULL')
      .getMany();

    if (!products) {
      throw new HttpException(
        ERROR_MESSAGES.productNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const filteredProducts = this.getFilteredProducts(products);

    return filteredProducts;
  }

  async findById(id: string): Promise<any> {
    const product = await this.productRepository
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(
        'product.category',
        'category',
        'category.deleted_at IS NULL',
      )
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
      .where('product.id = :productId', { productId: id })
      .andWhere('product.deleted_at IS NULL')
      .getOne();

    if (!product) {
      throw new HttpException(
        ERROR_MESSAGES.productNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const filteredProduct = this.getFilteredProduct(product);

    return filteredProduct;
  }

  async create(
    restaurantId: string,
    createProductDto: CreateProductDto,
  ): Promise<Product> {
    try {
      const { ingredients, category: categoryDto, title } = createProductDto;

      const existingProduct = await this.productRepository.findOne({
        where: { title, restaurantId, deletedAt: null },
      });

      if (existingProduct) {
        throw new HttpException(
          ERROR_MESSAGES.productAlreadyExists.replace(':title', title),
          HttpStatus.BAD_REQUEST,
        );
      }

      let category = await this.categoryRepository.findOne({
        where: { name: categoryDto.name, deletedAt: null },
      });
      if (!category) {
        category = new Category();
        category.name = toTitleCase(categoryDto.name);
        await this.categoryRepository.save(category);
      }

      const product = plainToClass(Product, createProductDto);
      product.restaurantId = restaurantId;
      product.title = toTitleCase(title);
      product.category = category;
      if (ingredients && ingredients.length > 0) {
        const uniqueIngredientNames = new Set<string>();
        let totalWeight = 0;

        const productIngredients = await Promise.all(
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

            totalWeight += ingredientDto.quantity;
            return productIngredient;
          }),
        );

        product.weight = totalWeight;
        product.productIngredients = productIngredients;
      }

      const result = await this.productRepository.save(product);

      return result;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    try {
      console.log('Updating product with data:', {
        id,
        ...updateProductDto,
      });

      // First verify the category exists if it's being updated
      if (updateProductDto.category) {
        const category = await this.categoryRepository.findOne({
          where: { name: updateProductDto.category.name }
        });
        
        if (!category) {
          throw new HttpException(
            'Category not found',
            HttpStatus.NOT_FOUND
          );
        }
      }

      const product = await this.productRepository
        .createQueryBuilder(this.alias)
        .leftJoinAndSelect(
          'product.category',
          'category',
          'category.deleted_at IS NULL',
        )
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
        .where('product.id = :productId', { productId: id })
        .andWhere('product.deleted_at IS NULL')
        .getOne();

      if (!product) {
        throw new HttpException(
          ERROR_MESSAGES.productNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      console.log('Found existing product:', product);

      // Update the product with new data
      if (updateProductDto.title) product.title = updateProductDto.title;
      if (updateProductDto.titleRo) product.titleRo = updateProductDto.titleRo;
      if (updateProductDto.titleRu) product.titleRu = updateProductDto.titleRu;
      if (updateProductDto.price !== undefined) product.price = updateProductDto.price;
      if (updateProductDto.image) product.image = updateProductDto.image;
      if (updateProductDto.preparationZone) product.preparationZone = updateProductDto.preparationZone;
      if (updateProductDto.preparationTime !== undefined) product.preparationTime = updateProductDto.preparationTime;
      if (updateProductDto.allergens) product.allergens = updateProductDto.allergens;
      if (updateProductDto.recipe) product.recipe = updateProductDto.recipe;
      if (updateProductDto.isAvailable !== undefined) product.isAvailable = updateProductDto.isAvailable;
      if (updateProductDto.tvaType) product.tvaType = updateProductDto.tvaType;
      if (updateProductDto.tvaPercentage !== undefined) product.tvaPercentage = updateProductDto.tvaPercentage;
      if (updateProductDto.masaNetto !== undefined) product.masaNetto = updateProductDto.masaNetto;

      // Handle ingredients update
      if (updateProductDto.ingredients) {
        console.log('Updating ingredients:', updateProductDto.ingredients);
        let totalWeight = 0;

        // Create a map of existing ingredients by both name and id for efficient lookup
        const existingByName = new Map();
        const existingById = new Map();
        product.productIngredients.forEach(pi => {
          if (pi.ingredient && pi.ingredient.name) {
            existingByName.set(pi.ingredient.name.toLowerCase(), pi);
          }
          existingById.set(pi.id, pi);
        });

        // Track which ingredients have been processed to handle removals
        const processedIngredients = new Set();

        // Update ingredients
        for (const ingredientDto of updateProductDto.ingredients) {
          let productIngredient;

          // First try to find by name if provided
          if (ingredientDto.name) {
            productIngredient = existingByName.get(ingredientDto.name.toLowerCase());
          }

          // If not found by name and we have an ID, try to find by ID
          if (!productIngredient && 'id' in ingredientDto) {
            productIngredient = existingById.get(ingredientDto.id);
          }

          // If found, update the quantity
          if (productIngredient) {
            productIngredient.quantity = ingredientDto.quantity;
            processedIngredients.add(productIngredient.id);
            totalWeight += ingredientDto.quantity;
            await this.productIngredientRepository.save(productIngredient);
          } else if (ingredientDto.name) {
            // If not found but we have a name, create new ingredient
            let ingredient = await this.ingredientRepository.findOne({
              where: { name: ingredientDto.name, deletedAt: null },
            });

            if (!ingredient) {
              ingredient = new Ingredient();
              ingredient.name = toTitleCase(ingredientDto.name);
              await this.ingredientRepository.save(ingredient);
            }

            const newProductIngredient = new ProductIngredient();
            newProductIngredient.product = product;
            newProductIngredient.ingredient = ingredient;
            newProductIngredient.quantity = ingredientDto.quantity;
            await this.productIngredientRepository.save(newProductIngredient);

            product.productIngredients.push(newProductIngredient);
            processedIngredients.add(newProductIngredient.id);
            totalWeight += ingredientDto.quantity;
          }
        }

        // Remove any ingredients that weren't processed
        const ingredientsToRemove = product.productIngredients.filter(
          pi => !processedIngredients.has(pi.id)
        );

        if (ingredientsToRemove.length > 0) {
          await this.productIngredientRepository.remove(ingredientsToRemove);
          product.productIngredients = product.productIngredients.filter(
            pi => processedIngredients.has(pi.id)
          );
        }

        product.weight = totalWeight;
      } else if (updateProductDto.ingredients && updateProductDto.ingredients.length === 0) {
        // If an empty ingredients array was provided, remove all ingredients
        if (product.productIngredients.length > 0) {
          await this.productIngredientRepository.remove(product.productIngredients);
          product.productIngredients = [];
          product.weight = 0;
        }
      }

      const result = await this.productRepository.save(product);
      console.log('Updated product result:', result);
      return result;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateStatus(productId: string, status: boolean): Promise<Product> {
    try {
      const existingProduct = await this.productRepository.findOne({
        where: {
          id: productId,
          deletedAt: null,
        },
      });

      if (!existingProduct) {
        throw new HttpException(
          ERROR_MESSAGES.productNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      existingProduct.isAvailable = status;

      const updatedProduct = this.productRepository.create({
        ...existingProduct,
      });

      const result = await this.productRepository.save(updatedProduct);
      return result;
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(productId: string) {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new HttpException(
        ERROR_MESSAGES.productNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.productRepository.softRemove(product);

    return { deleted: true };
  }

  private getFilteredProduct(product: Product) {
    const filteredProduct = {
      id: product.id,
      title: product.title,
      titleRo: product.titleRo,
      titleRu: product.titleRu,
      price: product.price,
      weight: product.weight,
      tvaType: product.tvaType,
      tvaPercentage: product.tvaPercentage,
      masaNetto: product.masaNetto,
      image: product.image
        ? `${process.env.AWS_STATIC_URL}/images/${product.image}`
        : null,
      category: {
        id: product.category.id,
        name: product.category.name,
      },
      productIngredients: product.productIngredients.map((ingredient) => ({
        id: ingredient.id,
        quantity: ingredient.quantity,
        ingredient: {
          id: ingredient.ingredient.id,
          name: ingredient.ingredient.name,
        },
      })),
      recipe: product.recipe,
      allergens: product.allergens,
      preparationTime: product.preparationTime,
      preparationZone: product.preparationZone,
      isAvailable: product.isAvailable,
    };

    return filteredProduct;
  }

  private getFilteredProducts(products: Product[]) {
    const filteredProducts = products.map((product) =>
      this.getFilteredProduct(product),
    );

    return filteredProducts;
  }
}
