import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateSpaceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duration: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  height: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  width: number;
}
