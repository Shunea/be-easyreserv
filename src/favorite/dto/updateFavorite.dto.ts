import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateFavoriteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  restaurantId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId: string;
}
