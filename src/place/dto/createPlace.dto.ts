import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PlaceType } from '../enums/place.type.enum';

export class CreatePlaceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PlaceType)
  placeType: PlaceType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId: string;
}
