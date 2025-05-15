import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { UserFilterDto } from './user-filter.dto';

export class UpdateMessageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleRo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleRu: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messageEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messageRo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messageRu: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  sendMessageDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  communicationTypeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => UserFilterDto)
  userFilterDto: UserFilterDto;
}
