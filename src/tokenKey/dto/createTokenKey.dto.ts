import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateTokenKeyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  expireAt: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId: string;
}
