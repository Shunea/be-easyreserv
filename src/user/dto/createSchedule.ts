import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StaffStatus } from '../enums/staff.status.enum';
import { Colors } from '../enums/schedule.color.enum';

export class StaffScheduleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  date: Date;

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
  @IsNumber()
  workHours: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  floor: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(Colors)
  color: Colors;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(StaffStatus)
  status: StaffStatus;

  //@ApiProperty()
  //@IsNotEmpty()
  //@IsString()
  //place_id: string;
}
