import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DeviceType } from '../enum/device-type.enum';

export class CreateNotificationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  deviceToken: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(DeviceType)
  deviceType: DeviceType;
}
