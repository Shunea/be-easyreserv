import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ReservationStatus } from '../enums/reservationStatus.enum';

export class UpdateReservationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ReservationStatus)
  status: ReservationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tableId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tableIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  waiterId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  guestsNumber: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  date: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  startTime: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  endTime: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason: string;
}
