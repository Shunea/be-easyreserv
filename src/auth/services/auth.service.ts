import * as dotenv from 'dotenv';
import generateTokenKey from '@src/common/generateTokenKey';
import sendResetPassword from '@src/common/email/sendResetPassword';
import { CreateUserDto } from '@src/auth/dto/createUser.dto';
import { DUMMY_ID, ERROR_MESSAGES } from '@src/constants';
import { EmailService } from '@src/common/email/form/email.form';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { JwtPayload } from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import { ResetPasswordDto } from '../dto/resetPassword.dto';
import { TokenKey } from '@src/tokenKey/entities/tokenKey.entity';
import { TokenKeyService } from '@src/tokenKey/services/tokenKey.service';
import { UpdateUserDto } from '@src/user/dto/updateUser.dto';
import { User } from 'src/user/entities/user.entity';
import { UserService } from '@src/user/services/user.service';
import { compare } from 'bcrypt';

const ms = require('ms');
dotenv.config();

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly tokenKeyService: TokenKeyService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async validate(email: string, password: string): Promise<any> {
    const user = await this.userService.getExistingUser(email);

    if (!user || user.deletedAt !== null) {
      throw new HttpException(
        ERROR_MESSAGES.userNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    if (user) {
      const match = await compare(password, user.password);

      if (match) {
        return {
          id: user.id,
          username: user.username,
          role: user.role,
          restaurantId: user.restaurantId || DUMMY_ID,
          placeId: user.placeId || DUMMY_ID,
          isVerified: user.isVerified,
        };
      }
    }

    return null;
  }

  async loginUser(user: User) {
    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      restaurantId: user.restaurantId || DUMMY_ID,
      placeId: user.placeId || DUMMY_ID,
      avatar: user?.avatar
        ? `${process.env.AWS_STATIC_URL}/images/${user?.avatar}`
        : null,
    };

    const accessToken = await this.getAccessToken(payload);
    const refreshTokenData = await this.getRefreshToken(payload);

    return {
      accessToken,
      refreshTokenData,
    };
  }

  async registerUser(
    user: CreateUserDto,
    waiterClientId?: string,
  ): Promise<User> {
    return await this.userService.create(user, waiterClientId);
  }

  async resetPassword(
    body: ResetPasswordDto,
    request: any,
    i18n: I18nContext,
    response: any,
  ) {
    try {
      const { email } = body;

      const user = await this.userService.getByEmail(email);
      const tokenData = await generateTokenKey(
        request,
        ms(process.env.TOKEN_KEY_EXPIRATION),
      );

      const options = await sendResetPassword(
        { email, token: tokenData.token },
        i18n,
        request,
      );
      await this.emailService.sendMail(options);

      const tokenKey = new TokenKey();

      tokenKey.expireAt = tokenData.expireAt.toDate();
      tokenKey.token = tokenData.token;
      tokenKey.userId = user.id;

      await this.tokenKeyService.create(tokenKey, request);

      return response.status(HttpStatus.OK).json({ sended: true });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async updatePassword(
    body: ResetPasswordDto,
    request: any,
    i18n: I18nContext,
    response: any,
  ): Promise<any> {
    try {
      const { password, tokenKey } = body;

      const tokenKeyData = await this.tokenKeyService.getByTokenKey(tokenKey);

      const currentDate = new Date();
      const tokenExpireDate = new Date(tokenKeyData.expireAt);

      if (currentDate > tokenExpireDate) {
        throw new HttpException(
          ERROR_MESSAGES.resetPasswordCannotBeCompleted,
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.userService.getById(tokenKeyData.userId);

      if (!user) {
        throw new HttpException(
          ERROR_MESSAGES.userNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const updateDto = new UpdateUserDto();

      updateDto.password = password;

      await this.userService.update(
        user.id,
        updateDto,
        i18n,
        request,
        response,
      );
      await this.tokenKeyService.delete(tokenKeyData.id);

      return response.status(HttpStatus.OK).json({ updated: true });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  private async getAccessToken(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET_KEY,
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
    });
    return accessToken;
  }

  private async getRefreshToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET_KEY,
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
    });

    const date = new Date();
    date.setDate(date.getDate() + 1);

    return { token, expireAt: date };
  }
}
