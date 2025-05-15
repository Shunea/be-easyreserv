import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePlacementDto {
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
  image: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textEn: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textRo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  textRu: string;
}
