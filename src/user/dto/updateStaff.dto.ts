import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { StaffRole } from '../enums/staff.roles.enum';
import { Gender } from '../enums/gender.enum';
import { Role } from '../enums/roles.enum';
import { SalaryType } from '../enums/staff.salary-type.enum';
import { Currency } from '../enums/currency.enum';

export class UpdateStaffDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  username: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  role: string;

  roleName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateOfBirth: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  restaurantId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SalaryType)
  salaryType: SalaryType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Currency)
  currency: Currency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  salary: number;
}
