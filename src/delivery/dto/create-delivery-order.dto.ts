import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsPhoneNumber,
  IsUUID,
} from 'class-validator';
import { PaymentType } from '@src/payment/entities/payment-account.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { OperatorStatus } from '../enums/operator-status.enum';

export class CreateDeliveryOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  restaurant_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  client_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPhoneNumber()
  client_phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  address_entrance: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address_staircase?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address_floor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address_intercom?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PaymentType)
  payment_type: PaymentType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  total_amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courier_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber()
  courier_phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(DeliveryStatus)
  courier_status?: DeliveryStatus;

  @ApiPropertyOptional()
  @IsOptional()
  courier_pickup_time?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimated_delivery_time?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  estimated_preparation_time?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(OperatorStatus)
  operator_status?: OperatorStatus;

  @ApiPropertyOptional()
  @IsOptional()
  operator_modified_at?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  order_date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  created_at?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  deleted_at?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  client_latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  client_longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  courier_latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  courier_longitude?: number;
}
