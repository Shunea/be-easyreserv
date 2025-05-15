import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Shape } from '../enum/tableShape.enum';

export class UpdateTableDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tableName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  seats: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(Shape)
  shape: Shape;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  xCoordinates: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  yCoordinates: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rotationAngle: number;
}
