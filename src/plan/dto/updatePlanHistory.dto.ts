import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class UpdatePlanHistoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  restaurantId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  billingDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  nextBillingDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  startTrialPeriod: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  endTrialPeriod: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTrialPeriod: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPaid: boolean;
}
