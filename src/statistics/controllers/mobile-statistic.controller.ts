import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { PlanType } from '@src/plan/enum/planType.enum';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { Role } from '@src/user/enums/roles.enum';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { MobileStatisticsService } from '../services/mobile-statistics.service';

@ApiTags('MobileStatistics')
@Controller('mobile-statistics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class MobileStatisticsController {
  constructor(
    private readonly mobileStatisticsService: MobileStatisticsService,
  ) {}

  @Get('/home-page')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getHomeReportsPage(@CurrentUser() user: AuthUser) {
    return await this.mobileStatisticsService.mobileHomePage(user);
  }

  @Get('/reports-main-page')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getMainReportsPage(@CurrentUser() user: AuthUser) {
    return await this.mobileStatisticsService.mobileMainReportsPage(user);
  }
}
