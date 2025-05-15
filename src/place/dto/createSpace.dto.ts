import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSpaceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
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
