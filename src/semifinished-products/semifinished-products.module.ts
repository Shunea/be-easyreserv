import { Module } from '@nestjs/common';
import { SemifinishedProductsController } from './controllers/semifinished_products.controller';
import { SemifinishedProductsService } from './services/semifinished_products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from '@src/ingredient/entities/ingredient.entity';
import { ProductIngredient } from '@src/ingredient/entities/productIngredient.entity';
import { Product } from '@src/product/entities/product.entity';
import { SemifinishedProduct } from '@src/semifinished-products/entities/semifinished-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SemifinishedProduct, Ingredient, ProductIngredient, Product])],
  controllers: [SemifinishedProductsController],
  providers: [SemifinishedProductsService],
})
export class SemifinishedProductsModule {
}
