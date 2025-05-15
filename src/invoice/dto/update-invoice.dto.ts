import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { PaymentStatus } from '@src/invoice/enums/payment-status.enum';

export class UpdateInvoiceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  subscriptionSum: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  billingPeriod: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  businessName: string;
}
