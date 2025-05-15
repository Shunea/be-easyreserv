import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { SpaceItemType } from '../enum/space_items.enum';

export class UpdateSpaceItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(SpaceItemType)
  itemType: SpaceItemType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  xCoordinates: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  yCoordinates: number;
}
