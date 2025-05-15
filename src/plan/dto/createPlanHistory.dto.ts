import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePlanHistoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  planId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId: string;
}
