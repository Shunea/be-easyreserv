import {
  Controller,
  Body,
  Put,
  UseGuards,
  Get,
  Delete,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { Inactivate } from '@src/auth/decorators/inactivate.decorator';
import { InactivateGuard } from '@src/auth/guards/inactivate.guard';
import { NotificationService } from '../services/notification.service';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateNotificationDto } from '../dto/update-notification.dto';

@ApiTags('Notification')
@Controller('notification')
@ApiBearerAuth()
@UseGuards(
  AuthGuard('jwt'),
  RoleGuard,
  PlanGuard,
  ThrottlerGuard,
  InactivateGuard,
)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('/')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.CHEF,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.OPERATOR,
    StaffRole.SPECIALIST,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAllNotifications(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
  ) {
    return await this.notificationService.getAllNotifications(
      user,
      request.queryParsed,
    );
  }

  @Get('/status')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.CHEF,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.OPERATOR,
    StaffRole.SPECIALIST,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getNotificationStatus(@CurrentUser() user: AuthUser) {
    return await this.notificationService.getNotificationStatus(user.id);
  }

  @Put('/enable')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.CHEF,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.OPERATOR,
    StaffRole.SPECIALIST,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async enableNotification(
    @CurrentUser() user: AuthUser,
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    return await this.notificationService.enableNotification(
      user.id,
      createNotificationDto,
    );
  }

  @Put('/refresh-token')
  @Inactivate(true)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.CHEF,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.OPERATOR,
    StaffRole.SPECIALIST,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async refreshDeviceToken(
    @CurrentUser() user: AuthUser,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return await this.notificationService.refreshDeviceToken(
      user,
      updateNotificationDto,
    );
  }

  @Put('/disable')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.CHEF,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.OPERATOR,
    StaffRole.SPECIALIST,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async disableNotification(
    @CurrentUser() user: AuthUser,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return await this.notificationService.disableNotification(
      user.id,
      updateNotificationDto,
    );
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.CHEF,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.OPERATOR,
    StaffRole.SPECIALIST,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') notificationId: string) {
    return await this.notificationService.delete(notificationId);
  }
}
