import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ServiceType } from '../enums/serviceType.enum';
import { CourseType } from '../enums/courseType.enum';
import { Doneness } from '../enums/doneness.enum';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Quantity of the product ordered',
    example: 2,
    type: Number,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Price of the product',
    example: 29.99,
    type: Number,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional({
    description: 'Whether the order is a pre-order',
    example: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isPreorder?: boolean;

  @ApiPropertyOptional({
    description: 'Creation notice or special instructions',
    example: 'Extra cheese and no onions',
    type: String,
  })
  @IsOptional()
  @IsString()
  creationNotice?: string;

  @ApiProperty({
    description: 'Service type for the order',
    enum: ServiceType,
    example: ServiceType.ON_SITE,
    type: 'enum',
  })
  @IsNotEmpty()
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({
    description: 'Course type for the order',
    enum: CourseType,
    example: CourseType.COURSE_1,
    type: 'enum',
  })
  @IsNotEmpty()
  @IsEnum(CourseType)
  courseType: CourseType;

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

// Create a wrapper DTO for the array
export class CreateOrdersDto {
  @ApiProperty({
    type: [CreateOrderDto],
    description: 'Array of orders to create',
  })
  orders: CreateOrderDto[];
}
