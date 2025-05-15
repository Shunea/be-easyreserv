import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { StockCategory } from '../enums/stock_category.enum';
import { TVAType } from '../enums/tva_type.enum';
import { Unit } from '../enums/unit.enum';
import { PaymentMethod } from '../enums/payment_method.enum';

export class CreateStockDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(StockCategory)
  category: StockCategory;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  expirationDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  volume: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pcVolume: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Unit)
  pcUnit: Unit;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(Unit)
  unit: Unit;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  reorderLimit: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(TVAType)
  tvaType: TVAType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  priceWithoutTva: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  invoiceNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
