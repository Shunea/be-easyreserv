import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsDate,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentType, PaymentStatus } from '../entities/payment-account.entity';

export class FilterPaymentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  restaurant_id?: string;

  @ApiProperty({ required: false, enum: PaymentType })
  @IsOptional()
  @IsEnum(PaymentType)
  payment_type?: PaymentType;

  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status?: PaymentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  operator_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_date?: Date;

  @ApiProperty({ required: false, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
