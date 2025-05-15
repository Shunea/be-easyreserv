import { Controller, Post, Body } from '@nestjs/common';
import { AppleService } from './apple.service';
import { Inactivate } from '@src/auth/decorators/inactivate.decorator';
import { AppleVerifyDto } from '../dto/apple-auth.verify.dto';
import { ApiTags } from '@nestjs/swagger';

@Inactivate(true)
@ApiTags('AppleAuth')
@Controller('apple')
export class AppleController {
  constructor(private readonly appleService: AppleService) {}

  @Post('/mobile-oauth')
  async verifyIdToken(@Body() appleVerifyDto: AppleVerifyDto) {
    return await this.appleService.verifyToken(appleVerifyDto);
  }
}
