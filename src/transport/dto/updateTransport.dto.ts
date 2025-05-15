import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTransportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  seats: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  mileage: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  userIds: string[];
}
