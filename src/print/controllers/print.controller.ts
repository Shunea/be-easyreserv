import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { PrintService } from '../services/print.service';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { Role } from '@src/user/enums/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Print')
@Controller('print')
// @ApiBearerAuth()
// @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class PrintController {
  constructor(private readonly printService: PrintService) {}

  // @Post('/')
  // @Roles(StaffRole.HOSTESS, StaffRole.SUPER_HOSTESS, StaffRole.WAITER)
  // @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  // async print(@Body() body: PrintDto) {
  //   return await this.printService.print(body);
  // }

  @Get('/:reservationId/waiter')
  @Roles(StaffRole.HOSTESS, StaffRole.SUPER_HOSTESS, StaffRole.WAITER)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getPrint(@Param('reservationId') reservationId: string, @Res() response: any) {
    return await this.printService.getPrint(reservationId, response);
  }

  @Get('/:reservationId/chef')
  @Roles(StaffRole.HOSTESS, StaffRole.SUPER_HOSTESS, StaffRole.CHEF)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getChefPrint(@Param('reservationId') reservationId: string, @Res() response: any) {
    return await this.printService.getChefPrint(reservationId, response);
  }

  @Get('/:reservationId/bartender')
  @Roles(StaffRole.HOSTESS, StaffRole.SUPER_HOSTESS, StaffRole.BARTENDER)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getBartenderPrint(@Param('reservationId') reservationId: string, @Res() response: any) {
    return await this.printService.getBartenderPrint(reservationId, response);
  }
}
