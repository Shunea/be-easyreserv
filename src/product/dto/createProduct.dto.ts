import { CreateCategoryDto } from '@src/category/dto/createCategory.dto';
import { CreateIngredientDto } from '@src/ingredient/dto/createIngredient.dto';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PreparationZones } from '../enums/preparation-zones.enum';

export class CreateProductDto {
  @ApiProperty({
    description: 'Title of the product',
    example: 'Grilled Salmon',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Title in Romanian',
    example: 'Somon la Grătar',
  })
  @IsString()
  @IsNotEmpty()
  titleRo: string;

  @ApiProperty({
    description: 'Title in Russian',
    example: 'Жареный Лосось',
  })
  @IsString()
  @IsNotEmpty()
  titleRu: string;

  @ApiProperty({
    description: 'Price of the product',
    example: 29.99,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    description: 'TVA type (A, B, C, D, E)',
    example: 'A',
    enum: ['A', 'B', 'C', 'D', 'E']
  })
  @IsString()
  @IsNotEmpty()
  tvaType: string;

  @ApiProperty({
    description: 'TVA percentage',
    example: 20.00,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @IsNotEmpty()
  tvaPercentage: number;

  @ApiPropertyOptional({
    description: 'Net mass in grams',
    example: 250.00,
    minimum: 0
  })
  @IsNumber()
  @IsOptional()
  masaNetto: number;

  @ApiPropertyOptional({
    description: 'Weight of the product in grams',
    example: 250,
    type: Number,
  })
  @IsNumber()
  @IsOptional()
  weight: number;

  @ApiPropertyOptional({
    description: 'Image URL or identifier',
    example: 'grilled-salmon.jpg',
  })
  @IsOptional()
  @IsNotEmpty()
  image: string;

  @ApiProperty({
    description: 'Zone where the product is prepared',
    enum: PreparationZones,
    example: PreparationZones.Hot,
    enumName: 'PreparationZones',
    examples: [
      PreparationZones.Hot,
      PreparationZones.Cold,
      PreparationZones.Fish,
      PreparationZones.Grill,
      PreparationZones.Desert,
      PreparationZones.Bar,
    ],
  })
  @IsNotEmpty()
  @IsEnum(PreparationZones)
  preparationZone: PreparationZones;

  @ApiProperty({
    description: 'Preparation time in minutes',
    example: 20,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  preparationTime: number;

  @ApiProperty({
    description: 'List of allergens',
    example: 'Fish, Dairy',
  })
  @IsNotEmpty()
  @IsString()
  allergens: string;

  @ApiProperty({
    description: 'Recipe or preparation instructions',
    example: 'Season with salt and pepper, grill for 4-5 minutes each side',
  })
  @IsNotEmpty()
  @IsString()
  recipe: string;

  @ApiProperty({
    description: 'Whether the product is available',
    default: true,
  })
  @IsNotEmpty()
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
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  ingredients: CreateIngredientDto[];
}
