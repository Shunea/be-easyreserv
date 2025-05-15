import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserFilterDto } from './user-filter.dto';
import { Type } from 'class-transformer';

export class CreateMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  titleEn: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  titleRo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  titleRu: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  messageEn: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  messageRo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  messageRu: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  startDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  endDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  discount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  sendMessageDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  communicationTypeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => UserFilterDto)
  userFilterDto: UserFilterDto;
}
