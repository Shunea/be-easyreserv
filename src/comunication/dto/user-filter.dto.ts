import { ApiProperty } from '@nestjs/swagger';
import { ClientsStatusForCommunication } from '../enums/clients-status.enum';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class UserFilterDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(ClientsStatusForCommunication)
  public clientStatus: ClientsStatusForCommunication;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  public lastVisit: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  public orderPriceFrom: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  public orderPriceTo: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public orderCategory: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  public timeOfTheDay: Date;
}
