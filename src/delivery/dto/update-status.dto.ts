import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryStatus } from '../enums/delivery-status.enum';

class Position {
  @ApiProperty({ example: 47.0285 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 28.8371 })
  @IsNumber()
  longitude: number;
}

export class UpdateStatusDto {
  @ApiProperty({ enum: DeliveryStatus, example: DeliveryStatus.IN_PREPARATION })
  @IsEnum(DeliveryStatus)
  @IsNotEmpty()
  status: DeliveryStatus;

  @ApiProperty()
  @ValidateNested()
  @Type(() => Position)
  position: Position;
}
