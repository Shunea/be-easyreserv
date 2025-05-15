import { ApiPropertyOptional } from '@nestjs/swagger';
import { CuisineType } from '@src/restaurant/enum/place-cuisine.enum';
import { WorkSchedule } from '@src/place/interfaces/work-schedule.interface';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsPhoneNumber,
  IsObject,
  IsNumber,
} from 'class-validator';

export class UpdateRestaurantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(CuisineType)
  cuisineType: CuisineType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  workSchedule: WorkSchedule;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHidden: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sector: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  placeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageGalery: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city: string;
}
