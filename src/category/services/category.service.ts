import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/createCategory.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateCategoryDto } from '../dto/updateCategory.dto';
import { toTitleCase } from '@src/common/utils';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';

@Injectable()
export class CategoryService {
  private alias = 'category';

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async getAll(restaurantId: string, user: AuthUser): Promise<Category[]> {
    const targetRestaurantId = restaurantId || user.restaurantId;

    const categories = await this.categoryRepository
      .createQueryBuilder(this.alias)
      .innerJoin('category.products', 'products', 'products.deleted_at IS NULL')
      .where('products.restaurant_id = :restaurantId', {
        restaurantId: targetRestaurantId,
      })
      .andWhere('products.deleted_at IS NULL')
      .getMany();

    return categories;
  }

  async getById(categoryId: string): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({
      id: categoryId,
      deletedAt: null,
    });

    if (!category) {
      throw new HttpException(
        ERROR_MESSAGES.categoryNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const categoryName = toTitleCase(createCategoryDto.name);
    const categoryNameRo = toTitleCase(createCategoryDto.nameRo);
    const categoryNameRu = toTitleCase(createCategoryDto.nameRu);

    const existingCategory = await this.categoryRepository.findOne({
      where: { name: categoryName, deletedAt: null },
    });

    if (existingCategory) {
      throw new HttpException(
        'Category with this name already exists!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const category = this.categoryRepository.create({
      name: categoryName,
      nameRo: categoryNameRo,
      nameRu: categoryNameRu,
    });
    return this.categoryRepository.save(category);
  }

  async update(
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<any> {
    try {
      const category = await this.categoryRepository.findOneBy({
        id: categoryId,
        deletedAt: null,
      });

      if (!category) {
        throw new HttpException(
          ERROR_MESSAGES.categoryNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.categoryRepository.update(categoryId, updateCategoryDto);

      return { ...category, ...updateCategoryDto };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(categoryId: string) {
    const category = await this.categoryRepository.findOneBy({
      id: categoryId,
      deletedAt: null,
    });

    if (!category) {
      throw new HttpException(
        ERROR_MESSAGES.categoryNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.categoryRepository.softDelete(categoryId);

    return { deleted: true };
  }
}
