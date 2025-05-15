import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import randomString from '@src/common/randomString';
import {
  ALL_CHARACTERS,
  REGEX_UUID_VALIDATION,
  SPECIAL_CHARACTERS,
} from '@src/constants';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { ConfirmEmailDto } from '../dto/confirmEmail.dto';
import { CreateClientDto } from '../dto/createClient.dto';
import { CreateStaffDto } from '../dto/createStaff.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ERROR_MESSAGES } from '@src/constants';
import { I18n, I18nContext } from 'nestjs-i18n';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { Response } from 'express';
import { Role } from '../enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StaffRole } from '../enums/staff.roles.enum';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateStaffDto } from '../dto/updateStaff.dto';
import { UpdateUserDto } from '../dto/updateUser.dto';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { SupportEmail } from '../dto/supportEmail.dto';
import { ContactEmailDto } from '../dto/contactEmail.dto';
import { ConfirmEmailUpdateDto } from '../dto/confirmEmailUpdate.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAll(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ): Promise<User[]> {
    const users = await this.userService.getAll(user, request.queryParsed);
    return response.status(HttpStatus.OK).json(users);
  }

  @Get('/staff/all')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAllStaff(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ): Promise<User[]> {
    const users = await this.userService.getAllStaff(user, {
      filter: request.query,
    });
    return response.status(HttpStatus.OK).json(users);
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
    StaffRole.GENERAL
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getById(@Param('id') id: string): Promise<User> {
    return await this.userService.getById(id);
  }

  @Get(`/staff/:staffId(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getStaffById(
    @Param('staffId') staffId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<User> {
    return await this.userService.getStaffById(user, staffId);
  }

  @Get('/staffWithScheduleAndVacation')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.WAITER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getStaffScheduleAndVacation(@CurrentUser() user: AuthUser) {
    return await this.userService.getStaffWithScheduleAndVacations(user);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
    StaffRole.OPERATOR,
    StaffRole.SPECIALIST,
    StaffRole.DRIVER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @I18n() i18n: I18nContext,
    @Req() request: any,
    @Res() response: any,
  ): Promise<User> {
    const res = await this.userService.update(
      id,
      body,
      i18n,
      request,
      response,
    );
    return response.status(HttpStatus.OK).json(res);
  }

  @Post('/create')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async createStaff(
    @CurrentUser() user: AuthUser,
    @Body() createStaff: CreateStaffDto,
    @I18n() i18n: I18nContext,
    @Req() request: any,
    @Res() response: any,
  ) {
    const { role } = createStaff;
    const { role: validRole, roleName } = this.userService.validateRole(role);
    createStaff.role = validRole;
    createStaff.roleName = roleName;

    let { email, phoneNumber } = createStaff;

    const existingUser = await this.userService.getExistingUser(
      email,
      phoneNumber,
      validRole,
    );

    if (existingUser) {
      const isSamePhone = existingUser.phoneNumber === phoneNumber;
      const isSameEmail = existingUser.email === email;

      if (isSamePhone || isSameEmail) {
        throw new HttpException(
          isSameEmail
            ? ERROR_MESSAGES.staffEmailAlreadyExists
            : ERROR_MESSAGES.staffPhoneAlreadyExists,
          HttpStatus.FOUND,
        );
      }
    }

    const randomChars = await randomString(8, ALL_CHARACTERS);
    const randomNumber = Math.floor(Math.random() * 101);
    const randomIndex = Math.floor(Math.random() * SPECIAL_CHARACTERS.length);
    const randomSpecialChar = SPECIAL_CHARACTERS.charAt(randomIndex);

    createStaff[
      'password'
    ] = `${randomSpecialChar}${randomChars}${randomNumber}`;

    const staff = await this.userService.createStaff(user, createStaff);

    return await this.userService.verificationEmail(
      { ...createStaff, temporaryPassword: true },
      staff.id,
      i18n,
      request,
      response,
    );
  }

  @Post('/client/create')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN, 
    StaffRole.WAITER, 
    StaffRole.HOSTESS, 
    StaffRole.SUPER_HOSTESS
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async createClient(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateClientDto,
  ) {
    return await this.userService.createClient(user, body);
  }

  @Put(`/staff/:staffId(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async updateStaff(
    @Param('staffId') staffId: string,
    @Body() body: UpdateStaffDto,
    @I18n() i18n: I18nContext,
    @Req() request: any,
    @Res() response: any,
  ): Promise<User> {
    if (body.role) {
      const { role: validRole, roleName } = this.userService.validateRole(body.role);
      body.role = validRole;
      body.roleName = roleName;
    }

    return await this.userService.updateStaff(
      staffId,
      body,
      i18n,
      request,
      response,
    );
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') id: string) {
    return await this.userService.delete(id);
  }

  @Post('/confirm')
  async confirm(
    @Body() confirmationDto: ConfirmEmailDto,
    @Res() response: any,
  ) {
    return await this.userService.confirmEmail(confirmationDto, response);
  }

  @Post('/confirm/update-email')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  async confirmEmailUpdate(
    @Body() body: ConfirmEmailUpdateDto,
    @Res() response: any,
  ) {
    const res = await this.userService.confirmEmailUpdate(body, response);
    return response.status(HttpStatus.OK).json(res);
  }

  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @Post('/support-email')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.WAITER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async sendSupportEmail(
    @Body() supportEmailDto: SupportEmail,
    @CurrentUser() user: AuthUser,
    @Res() response: any,
  ) {
    return await this.userService.sendSupportEmail(
      supportEmailDto,
      user,
      response,
    );
  }

  @Post('/contact')
  async contactEmail(
    @Body() contactEmailDto: ContactEmailDto,
    @I18n() i18n: I18nContext,
    @Req() request: any,
    @Res() response: any,
  ) {
    return await this.userService.contactEmail(
      contactEmailDto,
      i18n,
      request,
      response,
    );
  }

  @Get('/client/:clientId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.WAITER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getClientById(
    @CurrentUser() user: AuthUser,
    @Param('clientId') clientId: string,
    @Query('reviewType') reviewType: string,
    @Res() response: Response,
  ) {
    const client = await this.userService.getClientById(
      clientId,
      user,
      reviewType,
    );
    return response.status(HttpStatus.OK).json(client);
  }

  @Get('/clients/all')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getAllClients(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: Response,
  ) {
    const users = await this.userService.getAllClients(
      user,
      request.queryParsed,
    );
    return response.status(HttpStatus.OK).json(users);
  }

  @Get('/overview-calendar/:yearAndMonth/:previousDays/:upcomingDays')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getOverviewCalendar(
    @CurrentUser() user: AuthUser,
    @Param('yearAndMonth') yearAndMonth: string,
    @Param('previousDays') previousDays: number,
    @Param('upcomingDays') upcomingDays: number,
    @Res() response: Response,
  ) {
    const users = await this.userService.getOverviewCalendar(
      user,
      yearAndMonth,
      previousDays,
      upcomingDays,
    );

    return response.status(HttpStatus.OK).json(users);
  }
}
