import { CreateCategoryDto } from '@src/category/dto/createCategory.dto';
import { CreateIngredientDto } from '@src/ingredient/dto/createIngredient.dto';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PreparationZones } from '../enums/preparation-zones.enum';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Title of the product',
    example: 'Grilled Salmon',
  })
  @IsOptional()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Title in Romanian',
    example: 'Somon la Grătar',
  })
  @IsOptional()
  @IsString()
  titleRo: string;

  @ApiPropertyOptional({
    description: 'Title in Russian',
    example: 'Жареный Лосось',
  })
  @IsOptional()
  @IsString()
  titleRu: string;

  @ApiPropertyOptional({
    description: 'Price of the product',
    example: 29.99,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  price: number;

  @ApiPropertyOptional({
    description: 'TVA type (A, B, C, D, E)',
    example: 'A',
    enum: ['A', 'B', 'C', 'D', 'E']
  })
  @IsOptional()
  @IsString()
  tvaType: string;

  @ApiPropertyOptional({
    description: 'TVA percentage',
    example: 20.00,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  tvaPercentage: number;

  @ApiPropertyOptional({
    description: 'Net mass in grams',
    example: 250.00,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  masaNetto: number;

  @ApiPropertyOptional({
    description: 'Weight of the product in grams',
    example: 250,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  weight: number;

  @ApiPropertyOptional({
    description: 'Image URL or identifier',
    example: 'grilled-salmon.jpg',
  })
  @IsOptional()
  @IsString()
  image: string;

  @ApiPropertyOptional({
    description: 'Zone where the product is prepared',
    enum: PreparationZones,
    example: PreparationZones.Hot,
  })
  @IsOptional()
  @IsEnum(PreparationZones)
  preparationZone: PreparationZones;

  @ApiPropertyOptional({
    description: 'Preparation time in minutes',
    example: 20,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  preparationTime: number;

  @ApiPropertyOptional({
    description: 'List of allergens',
    example: 'Fish, Dairy',
  })
  @IsOptional()
  @IsString()
  allergens: string;

  @ApiPropertyOptional({
    description: 'Recipe or preparation instructions',
    example: 'Season with salt and pepper, grill for 4-5 minutes each side',
  })
  @IsOptional()
  @IsString()
  recipe: string;

  @ApiPropertyOptional({
    description: 'Whether the product is available',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable: boolean;

  @ApiPropertyOptional({
    description: 'Category information',
    type: () => CreateCategoryDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCategoryDto)
  category: CreateCategoryDto;

  @ApiPropertyOptional({
    description: 'List of ingredients with quantities',
    type: [CreateIngredientDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientDto)
  ingredients: CreateIngredientDto[];
}
