import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateReviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  restaurantId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reservationId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message: string;

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
  @IsString()
  userId: string;
}
