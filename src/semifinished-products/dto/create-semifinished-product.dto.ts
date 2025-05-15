import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateIngredientDto } from '@src/ingredient/dto/createIngredient.dto';
import { Type } from 'class-transformer';
import { CreateCategoryDto } from '@src/category/dto/createCategory.dto';

export class CreateSemifinishedProductDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  weight_formula: string;

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
