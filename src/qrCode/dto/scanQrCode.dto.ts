import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { QRCodeStatus } from '../enum/qrCode_status.enum';

export class ScanQrCodeDto {
  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsEnum(QRCodeStatus)
  status: QRCodeStatus;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiPropertyOptional()
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date?: string;
}
