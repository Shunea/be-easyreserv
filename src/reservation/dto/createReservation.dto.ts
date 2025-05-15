import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '../enums/reservationStatus.enum';

export class CreateReservationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  date: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  startTime: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  endTime: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  guestsNumber: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  tableIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  waiterId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ReservationStatus)
  status: ReservationStatus;
}
