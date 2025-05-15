import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateReservationDto } from '../dto/createReservation.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Reservation } from '../entities/reservation.entity';
import { ReservationService } from '../services/reservation.service';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateReservationDto } from '../dto/updateReservation.dto';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiTags('Reservation')
@Controller('reservation')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get('/')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @ApiHeader({
    name: 'x-waiter-code',
    description: 'Optional waiter code to act on behalf of another waiter',
    required: false,
  })
  async getAll(
    @Req() request: any,
    @Res() response: any,
    @CurrentUser() user: AuthUser,
    @Headers('x-waiter-code') waiterCode?: string,
  ): Promise<Reservation[]> {
    const reservations = await this.reservationService.getAll(
      user,
      request.queryParsed,
      waiterCode,
    );
    return response.status(HttpStatus.OK).json(reservations);
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @ApiHeader({
    name: 'x-waiter-code',
    description: 'Optional waiter code to act on behalf of another waiter',
    required: false,
  })
  async getById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Headers('x-waiter-code') waiterCode?: string,
  ): Promise<Reservation> {
    return await this.reservationService.getById(id, user, waiterCode);
  }

  @Post('/')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.WAITER,
  )
  @ApiHeader({
    name: 'x-waiter-code',
    description: 'Optional waiter code to act on behalf of another waiter',
    required: false,
  })
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createReservationDto: CreateReservationDto,
    @I18n() i18n: I18nContext,
    @Headers('x-waiter-code') waiterCode?: string,
  ) {
    return await this.reservationService.create(
      user,
      createReservationDto,
      i18n,
      waiterCode,
    );
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @ApiHeader({
    name: 'x-waiter-code',
    description: 'Optional waiter code to act on behalf of another waiter',
    required: false,
  })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
    @I18n() i18n: I18nContext,
    @Headers('x-waiter-code') waiterCode?: string,
  ): Promise<Reservation> {
    return await this.reservationService.update(
      id,
      updateReservationDto,
      user,
      i18n,
      waiterCode,
    );
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @ApiHeader({
    name: 'x-waiter-code',
    description: 'Optional waiter code to act on behalf of another waiter',
    required: false,
  })
  async delete(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Headers('x-waiter-code') waiterCode?: string,
  ) {
    return await this.reservationService.delete(id, user, waiterCode);
  }

  @Get('/table/:tableId')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.WAITER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getByTableId(
    @Res() response: any,
    @Req() request: any,
    @Param('tableId') tableId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Reservation[]> {
    const reservations = await this.reservationService.getAllByTable(
      request.queryParsed,
      tableId,
      user,
    );
    return response.status(HttpStatus.OK).json(reservations);
  }

  @Get('/clients')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.WAITER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getReservationClients(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ): Promise<any> {
    const clients = await this.reservationService.getReservationClients(
      request.queryParsed,
      user,
    );
    return response.status(HttpStatus.OK).json(clients);
  }

  @Get('/client/:reservationId')
  @Roles(
    StaffRole.WAITER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    Role.SUPER_ADMIN,
    Role.ADMIN,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getClientRezervationById(
    @CurrentUser() user: AuthUser,
    @Param('reservationId') reservationId: string,
    @Res() response: any,
  ): Promise<any> {
    const reservation = await this.reservationService.getClientRezervationById(
      reservationId,
      user,
    );
    return response.status(HttpStatus.OK).json(reservation);
  }

  @Post(`/:id(${REGEX_UUID_VALIDATION})/pick`)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @ApiHeader({
    name: 'x-waiter-code',
    description: 'Optional waiter code to pick up the reservation. If not provided, the current user will be assigned.',
    required: false,
  })
  async pickReservation(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @I18n() i18n: I18nContext,
    @Headers('x-waiter-code') waiterCode?: string,
  ): Promise<Reservation> {
    return await this.reservationService.pickReservation(
      id,
      user,
      waiterCode,
      i18n,
    );
  }
}
