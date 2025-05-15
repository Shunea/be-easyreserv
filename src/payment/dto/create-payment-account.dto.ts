import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { PaymentType, PaymentStatus } from '../entities/payment-account.entity';

export class CreatePaymentAccountDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  receipt_number: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  order_id: string;

  @ApiProperty({ enum: PaymentType })
  @IsNotEmpty()
  @IsEnum(PaymentType)
  payment_type: PaymentType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  discount_value?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  discount_percent?: number;

  @ApiProperty({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;
}
