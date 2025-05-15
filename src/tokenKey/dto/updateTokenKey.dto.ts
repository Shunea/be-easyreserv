import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateTokenKeyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  token: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  expireAt: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId: string;
}
