import { Ingredient } from './entities/ingredient.entity';
import { IngredientController } from './controllers/ingredient.controller';
import { IngredientService } from './services/ingredient.service';
import { Module } from '@nestjs/common';
import { Product } from '@src/product/entities/product.entity';
import { ProductIngredient } from '@src/ingredient/entities/productIngredient.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient, ProductIngredient, Product])],
  controllers: [IngredientController],
  providers: [IngredientService],
})
export class IngredientModule {}
