import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { VacationStatus } from '../enums/vacation_status.enum';

export class UpdateVacationStatusDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(VacationStatus)
  vacationStatus: VacationStatus;
}
