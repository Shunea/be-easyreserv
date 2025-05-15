import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty } from 'class-validator';
import { VacationType } from '../enums/vacation-type.enum';

export class CreateVacationDto {
  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(VacationType)
  vacationType: VacationType;
}
