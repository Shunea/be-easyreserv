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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreatePlanHistoryDto } from '../dto/createPlanHistory.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { PlanGuard } from '../guards/plan.guard';
import { PlanHistory } from '../entities/planHistory.entity';
import { PlanHistoryService } from '../services/planHistory.service';
import { PlanType } from '../enum/planType.enum';
import { Plans } from '../decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdatePlanHistoryDto } from '../dto/updatePlanHistory.dto';

@ApiTags('PlanHistory')
@Controller('plan-history')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class PlanHistoryController {
  constructor(private readonly planHistoryService: PlanHistoryService) {}

  @Post('/')
  @Roles(Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async create(
    @Body() body: CreatePlanHistoryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.planHistoryService.create(body, user);
  }

  @Get('/')
  @Roles(Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAll(
    @Req() request: any,
    @Res() response: any,
    @CurrentUser() user: AuthUser,
  ): Promise<PlanHistory[]> {
    const planHistorys = await this.planHistoryService.getAll(
      user,
      request.queryParsed,
    );
    return response.status(HttpStatus.OK).json(planHistorys);
  }

  @Get('/status')
  @Roles(Role.SUPER_ADMIN)
  async getStatus(
    @Res() response: any,
    @CurrentUser() user: AuthUser,
  ): Promise<PlanHistory[]> {
    return await this.planHistoryService.getStatus(user, response);
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getById(
    @Param('id') id: string,
    @Res() response: any,
  ): Promise<PlanHistory> {
    return await this.planHistoryService.getById(id, response);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @Param('id') id: string,
    @Body() body: UpdatePlanHistoryDto,
    @Res() response: any,
  ): Promise<PlanHistory> {
    const updatedPlanHistory = await this.planHistoryService.update(id, body);
    return response.status(HttpStatus.OK).json(updatedPlanHistory);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') id: string, @Res() response: any) {
    return await this.planHistoryService.delete(id, response);
  }
}
