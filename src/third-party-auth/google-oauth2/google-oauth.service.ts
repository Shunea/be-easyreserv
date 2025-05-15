import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import generateRandomPassword from '@src/common/generateRandomPassword';
import { ERROR_MESSAGES } from '@src/constants';
import { User } from '@src/user/entities/user.entity';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { GoogleVerifyDto } from '../dto/google-auth.verify.dto';
import { ThirdLoginMethods } from '../helper/login-methods';
import { AuthPlatform } from '../enums/auth-platform.enum';
import { RegisterUserType } from '../types/register-user.type';

@Injectable()
export class GoogleOauthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly thirdLoginMethods: ThirdLoginMethods,
  ) {}

  async googleOAuthLogic(email: string, username: string) {
    const existingUser = await this.userRepository
      .createQueryBuilder('user')
      .withDeleted()
      .where('user.email = :email', { email })
      .getOne();

    if (!existingUser) {
      const createUserObject: RegisterUserType = {
        authPlatform: AuthPlatform.Google,
        username,
        email,
        password: generateRandomPassword(),
      };

      const newUser = await this.thirdLoginMethods.registerUser(
        createUserObject,
      );

      return await this.thirdLoginMethods.login(newUser);
    }

    if (existingUser.deletedAt !== null) {
      throw new HttpException(
        ERROR_MESSAGES.userEmailAlreadyRegistered,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (existingUser.isGoogleAuth === false) {
      throw new HttpException(
        ERROR_MESSAGES.userEmailAlreadyRegistered,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (existingUser.isGoogleAuth === true) {
      return await this.thirdLoginMethods.login(existingUser);
    }
  }

  async verifyToken(body: GoogleVerifyDto) {
    const { idToken } = body;
    const oauthClient = new OAuth2Client();

    try {
      const response = await oauthClient.verifyIdToken({
        idToken,
        audience: [
          process.env.GOOGLE_CLIENT_ID_ANDROID,
          process.env.GOOGLE_CLIENT_ID_IOS,
        ],
      });

      const payload = response.getPayload();

      if (payload) {
        const { email, name } = payload;

        return await this.googleOAuthLogic(email, name);
      } else {
        throw new HttpException(
          ERROR_MESSAGES.invalidToken,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
