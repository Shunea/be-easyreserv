import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PurposeStatus } from '../enums/purpose-status.enum';

export class UpdatePurposeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(PurposeStatus)
  status: PurposeStatus;
}
