import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from '@src/auth/dto/createUser.dto';
import { AuthService } from '@src/auth/services/auth.service';
import { RefreshTokenService } from '@src/refreshToken/services/refreshToken.service';
import { User } from '@src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserType } from '../types/register-user.type';
import { AuthPlatform } from '../enums/auth-platform.enum';

@Injectable()
export class ThirdLoginMethods {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async login(user: User) {
    const { accessToken, refreshTokenData } = await this.authService.loginUser(
      user,
    );

    const existingRefreshToken = await this.refreshTokenService.getByUserId(
      user.id,
    );

    if (existingRefreshToken) {
      await this.refreshTokenService.deleteByUserId(user.id);
    }

    await this.refreshTokenService.create({
      token: refreshTokenData.token,
      expireAt: refreshTokenData.expireAt,
      userId: user.id,
    });

    return { user: user, accessToken, refreshToken: refreshTokenData.token };
  }

  async registerUser(registerUserObject: RegisterUserType) {
    const { authPlatform, username, email, password } = registerUserObject;

    const createUserDto = new CreateUserDto();
    createUserDto.username = username;
    createUserDto.email = email;
    createUserDto.phoneNumber = process.env.PHONE_NUMBER_REPLACE;
    createUserDto.password = password;

    const newUser = await this.authService.registerUser(createUserDto);
    newUser.isVerified = true;
    newUser[
      authPlatform === AuthPlatform.Apple ? 'isAppleAuth' : 'isGoogleAuth'
    ] = true;
    return await this.userRepository.save(newUser);
  }
}
