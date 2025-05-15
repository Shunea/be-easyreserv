import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ example: 47.0285 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 28.8371 })
  @IsNumber()
  longitude: number;
}
