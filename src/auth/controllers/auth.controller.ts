import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Get,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { AuthUser } from '../interfaces/auth-user.interface';
import { CreateUserDto } from '@src/auth/dto/createUser.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { DUMMY_ID, ERROR_MESSAGES } from '@src/constants';
import { I18n, I18nContext } from 'nestjs-i18n';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from '../dto/loginUser.dto';
import { PlaceService } from '@src/place/services/place.service';
import { RefreshTokenDto } from '../dto/refreshToken.dto';
import { RefreshTokenService } from '@src/refreshToken/services/refreshToken.service';
import { ResetPasswordDto } from '../dto/resetPassword.dto';
import { Response } from 'express';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { UserService } from '@src/user/services/user.service';
import { Role } from '@src/user/enums/roles.enum';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly jwtService: JwtService,
    private readonly placeService: PlaceService,
  ) {}

  @Post('/register')
  async registerUser(
    @Body() createUserDto: CreateUserDto,
    @Res() response: Response,
    @Req() request: any,
    @I18n() i18n: I18nContext,
  ) {
    let isAlreadyRegistered = false;
    let waiterClientId = null;
    const { isSuperAdmin, planId, email, phoneNumber } = createUserDto;

    if (!planId && isSuperAdmin) {
      throw new HttpException(
        ERROR_MESSAGES.cannotRegisterWithoutPlan,
        HttpStatus.BAD_REQUEST,
      );
    }

    const role = isSuperAdmin ? Role.SUPER_ADMIN : Role.USER;
    const user = await this.userService.getExistingUser(
      email,
      phoneNumber,
      role,
    );

    if (user) {
      const staffRoles = [
        StaffRole.WAITER,
        StaffRole.HOSTESS,
        StaffRole.SUPER_HOSTESS,
      ];
      const isSameEmail = user.email === email;
      const isSamePhone = user.phoneNumber === phoneNumber;
      const isSameRole = isSuperAdmin
        ? user.role === Role.SUPER_ADMIN
        : user.role === Role.USER;
      const isCreatedByStaff =
        user.createdAt && !user.deletedAt
          ? staffRoles.includes(
              await this.userService
                .getById(user.createdBy)
                .then(({ role }) => role as any),
            )
          : false;

      if ((isSamePhone && isSameRole && !isCreatedByStaff) || isSameEmail) {
        isAlreadyRegistered = true;
      }

      if (isCreatedByStaff) {
        waiterClientId = user.id;
      }
    }

    if (isAlreadyRegistered) {
      if (user.email === email && user.phoneNumber === phoneNumber) {
        throw new HttpException(
          ERROR_MESSAGES.userEmailAndPhoneAlreadyRegistered,
          HttpStatus.FOUND,
        );
      } else if (user.email === email) {
        throw new HttpException(
          ERROR_MESSAGES.userEmailAlreadyRegistered,
          HttpStatus.FOUND,
        );
      } else if (user.phoneNumber === phoneNumber) {
        throw new HttpException(
          ERROR_MESSAGES.userPhoneAlreadyRegistered,
          HttpStatus.FOUND,
        );
      }
    }

    const createdUser = await this.authService.registerUser(
      createUserDto,
      waiterClientId,
    );

    delete createUserDto.password;

    return await this.userService.verificationEmail(
      { ...createUserDto, temporaryPassword: false },
      createdUser.id,
      i18n,
      request,
      response,
    );
  }

  @Post('/login')
  async loginUser(
    @Body() body: LoginUserDto,
    @Res() response: Response,
  ): Promise<any> {
    try {
      const user = await this.authService.validate(body.email, body.password);

      if (!user) {
        throw new HttpException(
          ERROR_MESSAGES.wrongEmailOrPassword,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!user.isVerified) {
        throw new HttpException(
          ERROR_MESSAGES.pleaseVerifyYourEmail,
          HttpStatus.BAD_REQUEST,
        );
      }

      delete user.isVerified;

      const { accessToken, refreshTokenData } =
        await this.authService.loginUser(user);

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

      return response.status(HttpStatus.OK).json({
        user: user,
        accessToken,
        refreshToken: refreshTokenData.token,
      });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @Post('/resend-verification-email')
  async resendVerificationEmail(
    @Body() body: { email: string },
    @Req() request: any,
    @I18n() i18n: I18nContext,
    @Res() response: any,
  ): Promise<any> {
    if (!body.email) {
      throw new HttpException(
        ERROR_MESSAGES.wrongEmailAddress,
        HttpStatus.BAD_REQUEST,
      );
    }

    const { id: userId, username } = await this.userService.getByEmail(
      body.email,
    );

    body['username'] = username;

    return await this.userService.verificationEmail(
      { ...body, temporaryPassword: false },
      userId,
      i18n,
      request,
      response,
    );
  }

  @Post('/reset-password')
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Req() request: any,
    @I18n() i18n: I18nContext,
    @Res() response: any,
  ): Promise<any> {
    return this.authService.resetPassword(body, request, i18n, response);
  }

  @Post('/update-password')
  async updatePassword(
    @Body() body: ResetPasswordDto,
    @Req() request: any,
    @I18n() i18n: I18nContext,
    @Res() response: any,
  ): Promise<any> {
    return this.authService.updatePassword(body, request, i18n, response);
  }

  @Post('/refresh-token')
  async refreshAccessToken(
    @Body() body: RefreshTokenDto,
    @Res() response: Response,
  ): Promise<any> {
    try {
      const { refreshToken, restaurantId } = body;
      const refreshTokenData = await this.refreshTokenService.getByRefreshToken(
        refreshToken,
      );

      if (!refreshTokenData) {
        return response.status(HttpStatus.OK).json({ isExpired: true });
      }

      const currentDate = new Date();
      const refreshTokenExpireDate = new Date(refreshTokenData.expireAt);

      if (currentDate > refreshTokenExpireDate) {
        await this.refreshTokenService.delete(refreshTokenData.id);
        return response.status(HttpStatus.OK).json({ isExpired: true });
      }

      const validRefreshToken = await this.jwtService.verify(
        refreshTokenData.token,
        {
          secret: process.env.REFRESH_TOKEN_SECRET_KEY,
        },
      );

      if (!validRefreshToken) {
        throw new HttpException(
          ERROR_MESSAGES.invalidRefreshToken,
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.userService.getById(refreshTokenData.userId);

      const { id: placeId } = restaurantId
        ? await this.placeService.getPlaceByRestaurantId(restaurantId, user)
        : null;

      const payload: JwtPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        restaurantId: restaurantId || user.restaurantId || DUMMY_ID,
        placeId: placeId || user.placeId || DUMMY_ID,
      };

      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.ACCESS_TOKEN_SECRET_KEY,
        expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
      });

      return response.status(HttpStatus.OK).json({ accessToken });
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  @Get('/logout')
  async logout(@CurrentUser() user: AuthUser, @Res() response: Response) {
    await this.refreshTokenService.deleteByUserId(user.id);

    response.clearCookie('jwt', { httpOnly: true, sameSite: 'strict' });

    return response.status(HttpStatus.OK).json({ logout: true });
  }

  @Get('/get-authenticated-user')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async getAuthenticatedUser(@Req() request: any, @Res() response: any) {
    if (!request.user) {
      return null;
    }

    const { exp, iat, ...userData } = request.user;

    return response.status(HttpStatus.OK).json(userData);
  }
}
