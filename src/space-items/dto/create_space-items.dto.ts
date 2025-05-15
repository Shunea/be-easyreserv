import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { SpaceItemType } from '../enum/space_items.enum';

export class CreateSpaceItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(SpaceItemType)
  itemType: SpaceItemType;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  xCoordinates: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  yCoordinates: number;
}
