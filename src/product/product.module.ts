import { Category } from '@src/category/entities/category.entity';
import { Ingredient } from '@src/ingredient/entities/ingredient.entity';
import { Module } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { ProductController } from './controllers/product.controller';
import { ProductIngredient } from '@src/ingredient/entities/productIngredient.entity';
import { ProductService } from './services/product.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Ingredient,
      Category,
      ProductIngredient,
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
