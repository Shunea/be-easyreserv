import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderForSuplierDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productTitle: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  productVolume: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  message: string;
}
