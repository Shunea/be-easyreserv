import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PurposeStatus } from '../enums/purpose-status.enum';

export class CreatePurposeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  endTime: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PurposeStatus)
  status: PurposeStatus;
}
