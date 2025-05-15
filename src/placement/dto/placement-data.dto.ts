import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PlacementDataDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  textEn: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  textRo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  textRu: string;

  @ApiProperty()
  @IsNotEmpty()
  restaurantsIds: string[];
}
