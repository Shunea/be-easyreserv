import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class CreateSuplierDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idno: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vatNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  iban: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
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
