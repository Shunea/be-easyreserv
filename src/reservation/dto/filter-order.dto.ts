import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../enums/orderStatus.enum';
import { PreparationZones } from '@src/product/enums/preparation-zones.enum';

export class FilterOrderDto {
  @ApiPropertyOptional({ 
    enum: OrderStatus,
    description: 'Filter by order status',
    example: OrderStatus.PENDING
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ 
    enum: PreparationZones,
    description: 'Filter by preparation zone',
    example: PreparationZones.Hot
  })
  @IsOptional()
  @IsEnum(PreparationZones)
  preparationZone?: PreparationZones;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    minimum: 1,
    default: 10
  })
  @IsOptional()
  limit?: number = 10;
} 