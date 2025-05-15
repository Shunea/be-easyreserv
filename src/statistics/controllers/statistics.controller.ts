import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { DashboardStatistics } from '../interfaces/statistics-dashboard.interface';
import { FilterParam } from '../enums/filter.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { StatisticsService } from '../services/statistics.service';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { Role } from '@src/user/enums/roles.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { PlanType } from '@src/plan/enum/planType.enum';

@ApiTags('Statistics')
@Controller('statistics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('/dashboard')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getDashboardStatistics(
    @CurrentUser() user: AuthUser,
  ): Promise<DashboardStatistics> {
    return await this.statisticsService.getDashboardStatistics(user);
  }

  @Get('/reports-main-page')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getReports(@CurrentUser() user: AuthUser) {
    return await this.statisticsService.getMainPageReports(user);
  }

  @Get('/reports-reservations-page')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getReservationsReports(
    @CurrentUser() user: AuthUser,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Query('periodType') filterParam: FilterParam,
  ) {
    return await this.statisticsService.getReservationsPageReports(
      user,
      new Date(startDate),
      new Date(endDate),
      filterParam,
    );
  }

  @Get('/reports-clients-page')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getClientsReports(
    @CurrentUser() user: AuthUser,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Query('periodType') filterParam: FilterParam,
  ) {
    return await this.statisticsService.getClientsPageReports(
      user,
      new Date(startDate),
      new Date(endDate),
      filterParam,
    );
  }

  @Get('/reports-reviews-page')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getReviewsReports(
    @CurrentUser() user: AuthUser,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Query('periodType') filterParam: FilterParam,
  ) {
    return await this.statisticsService.getReviewsPageReports(
      user,
      new Date(startDate),
      new Date(endDate),
      filterParam,
    );
  }

  @Get('/reports-sales-page')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getSalesReports(
    @CurrentUser() user: AuthUser,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Query('periodType') filterParam: FilterParam,
  ) {
    return await this.statisticsService.getSalesPageReports(
      user,
      new Date(startDate),
      new Date(endDate),
      filterParam,
    );
  }

  @Get('/products-status-page')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getProductsReports(@CurrentUser() user: AuthUser) {
    return await this.statisticsService.getProductsPageReports(user);
  }
}
