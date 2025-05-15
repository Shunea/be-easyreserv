import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommunicationTypesDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public type: string;
}
