import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Body, Controller, Put, UseGuards } from '@nestjs/common';
import { BonusService } from '../services/bonus.service';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateBonusDto } from '../dto/updateBonus.dto';

@ApiTags('Bonus')
@Controller('bonus')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class BonusController {
  constructor(private readonly bonusService: BonusService) {}

  @Put('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async udpate(@Body() body: UpdateBonusDto) {
    return await this.bonusService.update(body);
  }
}
