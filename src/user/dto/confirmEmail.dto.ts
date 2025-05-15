import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tokenKey: string;
}
