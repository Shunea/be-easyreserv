import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateVacationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  endDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  key: string;
}
