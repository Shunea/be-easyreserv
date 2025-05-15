import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CuisineType } from '@src/restaurant/enum/place-cuisine.enum';
import { WorkSchedule } from '@src/place/interfaces/work-schedule.interface';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  sector: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(CuisineType)
  cuisineType: CuisineType;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  workSchedule: WorkSchedule;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  planId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  placeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageGalery: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHidden: boolean;
}
