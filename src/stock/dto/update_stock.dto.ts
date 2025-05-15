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

export class UpdateStockDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(StockCategory)
  category: StockCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  expirationDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  volume: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Unit)
  unit: Unit;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  pcVolume: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  reorderLimit: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(TVAType)
  tvaType: TVAType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  priceWithoutTva: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  suplierName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  suplierId: string;
}
