import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleVerifyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  idToken: string;
}
