import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateDocumentDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  number: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  expireOn: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId: string;
}
