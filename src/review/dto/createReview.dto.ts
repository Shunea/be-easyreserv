import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reservationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  foodRating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  serviceRating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priceRating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ambienceRating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  behaviorRating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  communicationRating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  punctualityRating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  generosityRating: number;
}
