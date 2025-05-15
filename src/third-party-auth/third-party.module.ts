import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleOauthService } from './google-oauth2/google-oauth.service';
import { GoogleOauthController } from './google-oauth2/google-oauth.controller';
import { AuthModule } from '@src/auth/auth.module';
import { User } from '@src/user/entities/user.entity';
import { RefreshTokenModule } from '@src/refreshToken/refreshToken.module';
import { AppleController } from './apple-signin/apple.controller';
import { AppleService } from './apple-signin/apple.service';
import { PassportModule } from '@nestjs/passport';
import { ThirdLoginMethods } from './helper/login-methods';

@Module({
  imports: [
    AuthModule,
    RefreshTokenModule,
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'apple' }),
  ],
  exports: [GoogleOauthService, AppleService],
  controllers: [GoogleOauthController, AppleController],
  providers: [GoogleOauthService, AppleService, ThirdLoginMethods],
})
export class ThirdPartyAppAuth {}
