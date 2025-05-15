import { Body, Controller, Post } from '@nestjs/common';
import { GoogleOauthService } from './google-oauth.service';
import { ApiTags } from '@nestjs/swagger';
import { GoogleVerifyDto } from '../dto/google-auth.verify.dto';

@ApiTags('GoogleAuth')
@Controller('google')
export class GoogleOauthController {
  constructor(private readonly googleService: GoogleOauthService) {}

  @Post('/mobile-oauth')
  async googleMobileAuth(@Body() body: GoogleVerifyDto) {
    return await this.googleService.verifyToken(body);
  }
}
