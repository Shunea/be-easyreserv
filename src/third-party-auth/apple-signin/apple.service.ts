import appleSignIn from 'apple-signin-auth';
import generateRandomPassword from '@src/common/generateRandomPassword';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@src/user/entities/user.entity';
import { appleAuthConfigSchema } from '../config/apple-auth.config';
import { AppleVerifyDto } from '../dto/apple-auth.verify.dto';
import { ThirdLoginMethods } from '../helper/login-methods';
import { RegisterUserType } from '../types/register-user.type';
import { AuthPlatform } from '../enums/auth-platform.enum';

@Injectable()
export class AppleService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly thirdLoginMethods: ThirdLoginMethods,
  ) {}

  async verifyToken(appleVerifyDto: AppleVerifyDto): Promise<any> {
    const { idToken, username } = appleVerifyDto;

    try {
      const resultJSON = await appleSignIn.verifyIdToken(idToken, {
        audience: appleAuthConfigSchema.apple.clientID,
      });

      const existingUser = await this.userRepository
        .createQueryBuilder('user')
        .withDeleted()
        .where('user.email = :email', { email: resultJSON.email })
        .getOne();

      if (!existingUser) {
        const createUserObject: RegisterUserType = {
          authPlatform: AuthPlatform.Apple,
          username,
          email: resultJSON.email,
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

      if (existingUser.isAppleAuth === false) {
        throw new HttpException(
          ERROR_MESSAGES.userEmailAlreadyRegistered,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (existingUser.isAppleAuth === true) {
        return await this.thirdLoginMethods.login(existingUser);
      }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }
}
