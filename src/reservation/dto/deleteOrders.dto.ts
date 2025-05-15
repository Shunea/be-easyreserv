import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class DeleteOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  orderIds: string[];
}
