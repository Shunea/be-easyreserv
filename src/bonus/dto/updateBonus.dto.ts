import { ApiPropertyOptional } from '@nestjs/swagger';
import { BonusType } from '../enums/bonus.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateBonusDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(BonusType)
  public type: BonusType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public restaurantId: string;
}
