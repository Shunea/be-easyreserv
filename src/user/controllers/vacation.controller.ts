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
import { CreateVacationDto } from '../dto/createVacation.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '../enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { UpdateVacationDto } from '../dto/updateVacation.dto';
import { UpdateVacationStatusDto } from '../dto/updateVacarionStatus.dto';
import { VacationService } from '../services/vacation.service';

@ApiTags('Vacation')
@Controller('vacation')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class VacationController {
  constructor(private vacationService: VacationService) {}

  @Post(`/:userId(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async createVacation(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
    @Body() createVacation: CreateVacationDto,
  ) {
    return await this.vacationService.createVacation(
      user,
      userId,
      createVacation,
    );
  }

  @Get(`/user/:userId(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getAll(
    @Req() request: any,
    @Param('userId') userId: string,
    @Res() response: any,
  ) {
    const vacation = await this.vacationService.getAll(
      request.queryParsed,
      userId,
    );
    return response.status(HttpStatus.OK).json(vacation);
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getById(@Param('id') id: string) {
    return await this.vacationService.getById(id);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async update(
    @Param('id') id: string,
    @Body() vacationUpdate: UpdateVacationDto,
    @Res() response: any,
  ) {
    return await this.vacationService.updateVacation(
      id,
      vacationUpdate,
      response,
    );
  }

  @Put(`/status/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async updateVacationStatus(
    @Param('id') id: string,
    @Body() status: UpdateVacationStatusDto,
    @Res() response: any,
  ) {
    return await this.vacationService.updateVacationStatus(
      id,
      status,
      response,
    );
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async delete(@Param('id') id: string) {
    return await this.vacationService.deleteVacation(id);
  }
}
