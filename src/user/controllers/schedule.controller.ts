import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreatePurposeDto } from '../dto/createPurpose.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { Purpose } from '../entities/purpose.entity';
import { Role } from '../enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { ScheduleService } from '../services/schedule.service';
import { StaffRole } from '../enums/staff.roles.enum';
import { StaffScheduleDto } from '../dto/createSchedule';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdatePurposeDto } from '../dto/updatePurpose.dto';

@ApiTags('Schedule')
@Controller('schedule')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post(`/schedule/:staffId`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async createSchedule(
    @CurrentUser() user: AuthUser,
    @Param('staffId') staffId: string,
    @Body() schedules: StaffScheduleDto[],
  ) {
    return await this.scheduleService.createSchedule(user, staffId, schedules);
  }

  @Get('/schedule/:userId')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getSchedule(
    @Req() request: any,
    @Res() response: any,
    @Param('userId') userId: string,
  ) {
    const shedules = await this.scheduleService.getSchedule(
      request.queryParsed,
      userId,
    );
    return response.status(HttpStatus.OK).json(shedules);
  }

  @Get('/allSchedules')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user ID' })
  @ApiQuery({ 
    name: 'checkStatus', 
    required: false, 
    enum: [0, 1, 2], 
    description: 'Filter by status (0: Pending, 1: Checked In, 2: Checked Out)' 
  })
  @ApiQuery({ name: 'month', required: false, type: String, description: 'Filter by month (YYYY-MM)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of records per page' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of records to skip' })
  async getAllSchedules(
    @CurrentUser() user: AuthUser,
    @Query() query: {
      date?: string;
      userId?: string;
      checkStatus?: number;
      month?: string;
      limit?: number;
      skip?: number;
    },
    @Req() request: any,
    @Res() response: any,
  ) {
    const filter = {
      ...request.queryParsed,
      filter: {
        ...request.queryParsed?.filter,
        ...(query.date && { date: query.date }),
        ...(query.userId && { userId: query.userId }),
        ...(query.checkStatus !== undefined && { checkStatus: query.checkStatus }),
        ...(query.month && { month: query.month })
      },
      ...(query.limit && { limit: parseInt(query.limit.toString()) }),
      ...(query.skip && { skip: parseInt(query.skip.toString()) })
    };
    const schedules = await this.scheduleService.getAllSchedules(user, filter);
    return response.status(HttpStatus.OK).json(schedules);
  }

  @Get('/schedule/:userId/:date/:previousDays/:upcomingDays')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
    StaffRole.GENERAL
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getScheduleByDate(
    @Param('userId') userId: string,
    @Param('date') dateString: Date,
    @Param('previousDays') previousDays: number,
    @Param('upcomingDays') upcomingDays: number,
  ) {
    const date = new Date(dateString);
    return this.scheduleService.getScheduleByDate(
      userId,
      date,
      previousDays,
      upcomingDays,
    );
  }

  @Put('/schedule/:staffId/:scheduleId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async updateScheduleById(
    @CurrentUser() user: AuthUser,
    @Param('staffId') staffId: string,
    @Param('scheduleId') scheduleId: string,
    @Body() schedule: StaffScheduleDto,
  ) {
    return await this.scheduleService.updateScheduleById(
      user,
      staffId,
      scheduleId,
      schedule,
    );
  }

  @Put('/scheduleTitle/:staffId/:title')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async updateScheduleByTitle(
    @CurrentUser() user: AuthUser,
    @Param('staffId') staffId: string,
    @Param('title') title: string,
    @Body() scheduleDto: StaffScheduleDto,
    @Res() response: any,
  ) {
    return await this.scheduleService.updateScheduleByTitle(
      user,
      staffId,
      title,
      scheduleDto,
      response,
    );
  }

  @Delete('/schedule/:staffId/:scheduleId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async deleteSchedule(
    @CurrentUser() user: AuthUser,
    @Param('staffId') staffId: string,
    @Param('scheduleId') scheduleId: string,
  ) {
    return await this.scheduleService.deleteSchedule(user, staffId, scheduleId);
  }

  @Delete('/scheduleTitle/:staffId/:title')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async deleteScheduleByTtitle(
    @CurrentUser() user: AuthUser,
    @Param('staffId') staffId: string,
    @Param('title') title: string,
  ) {
    return await this.scheduleService.deleteScheduleByTitle(
      user,
      staffId,
      title,
    );
  }

  @Get('/purpose/:userId')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAllPurposesByUserId(
    @Param('userId') userId: string,
    @Req() request: any,
    @Res() response: any,
  ): Promise<Purpose[]> {
    const purposes = await this.scheduleService.getAllPurposes(
      request.queryParsed,
      userId,
    );

    return response.status(HttpStatus.OK).json(purposes);
  }

  @Post('/purpose/:scheduleId')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async createPurpose(
    @CurrentUser() user: AuthUser,
    @Param('scheduleId') scheduleId: string,
    @Body() createPurposeDto: CreatePurposeDto,
  ) {
    return await this.scheduleService.createPurpose(
      user,
      scheduleId,
      createPurposeDto,
    );
  }

  @Put('/purpose/:scheduleId/:purposeId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async updatePurpose(
    @Param('scheduleId') scheduleId: string,
    @Param('purposeId') purposeId: string,
    @Body() updatePurposeDto: UpdatePurposeDto,
  ) {
    return await this.scheduleService.updatePurpose(
      scheduleId,
      purposeId,
      updatePurposeDto,
    );
  }

  @Delete('/purpose/:purposeId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async deletePurpose(@Param('purposeId') purposeId: string) {
    return await this.scheduleService.deletePurpose(purposeId);
  }
}
