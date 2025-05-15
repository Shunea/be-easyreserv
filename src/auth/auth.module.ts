import * as dotenv from 'dotenv';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { EmailService } from '@src/common/email/form/email.form';
import { JwtModule } from '@nestjs/jwt';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RefreshTokenModule } from '@src/refreshToken/refreshToken.module';
import { TokenKeyModule } from '@src/tokenKey/tokenKey.module';
import { UserModule } from 'src/user/user.module';
import { PlaceModule } from '@src/place/place.module';
import { WaiterCodeMiddleware } from './middlewares/waiter-code.middleware';
import { ConfigModule } from '@nestjs/config';

dotenv.config();

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.ACCESS_TOKEN_SECRET_KEY,
        signOptions: {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
        },
      }),
    }),
    JwtModule.register({}),
    PassportModule,
    PlaceModule,
    RefreshTokenModule,
    TokenKeyModule,
    UserModule,
  ],
  exports: [AuthService, JwtStrategy, JwtRefreshStrategy],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, EmailService],
})
export class AuthModule {}
