import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Shape } from '../enum/tableShape.enum';

export class CreateTableDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  tableName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  seats: number;

  @ApiProperty()
  @IsEnum(Shape, { message: 'Invalid shape' })
  shape: Shape;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  x_coordinates: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  y_coordinates: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rotationAngle: number;
}
