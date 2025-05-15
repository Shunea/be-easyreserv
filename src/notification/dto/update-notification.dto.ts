import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DeviceType } from '../enum/device-type.enum';

export class UpdateNotificationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(DeviceType)
  deviceType: DeviceType;
}
