import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class UpdateSuplierDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name: string;

  @ApiPropertyOptional()
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  idno: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vatNumber: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  iban: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bankName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telegramUsername: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image: string;
}
