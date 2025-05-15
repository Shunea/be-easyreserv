import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@src/user/enums/gender.enum';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsEmail,
  IsPhoneNumber,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSuperAdmin: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateOfBirth: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;
}
