import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { OrderStatus } from '../enums/orderStatus.enum';
import { ServiceType } from '../enums/serviceType.enum';
import { CourseType } from '../enums/courseType.enum';
import { Doneness } from '../enums/doneness.enum';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Product ID to update to',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({
    description: 'New quantity of the product',
    example: 3,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({
    description: 'New status of the order',
    enum: OrderStatus,
    example: OrderStatus.PREPARING,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Creation notice or special instructions',
    example: 'Extra spicy please',
    type: String,
  })
  @IsOptional()
  @IsString()
  creationNotice?: string;

  @ApiPropertyOptional({
    description: 'Deletion notice or cancellation reason',
    example: 'Customer changed their mind',
    type: String,
  })
  @IsOptional()
  @IsString()
  deletionNotice?: string;

  @ApiPropertyOptional({
    description: 'Service type for the order',
    enum: ServiceType,
    example: ServiceType.ON_SITE,
    type: 'enum',
  })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiPropertyOptional({
    description: 'Course type for the order',
    enum: CourseType,
    example: CourseType.COURSE_1,
    type: 'enum',
  })
  @IsOptional()
  @IsEnum(CourseType)
  courseType?: CourseType;

  @ApiPropertyOptional({
    description: 'Doneness level (only for Grill, Fish, or Hot preparation zones)',
    enum: Doneness,
    example: Doneness.MEDIUM,
    type: 'enum',
  })
  @IsOptional()
  @IsEnum(Doneness)
  doneness?: Doneness;
}
