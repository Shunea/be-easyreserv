import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AppleVerifyDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  idToken: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  username: string;
}
