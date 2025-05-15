import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { CommunicationTypesService } from '../services/communication_types.service';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateCommunicationTypesDto } from '../dto/create_communication_types.dto';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { Role } from '@src/user/enums/roles.enum';
import { PlanType } from '@src/plan/enum/planType.enum';

@ApiTags('CommunicationType')
@Controller('communication-type')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class CommunicationTypeController {
  constructor(private communicationTypeService: CommunicationTypesService) {}

  @Post('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async createCommunicationType(
    @CurrentUser() user: AuthUser,
    @Body() createCommunicationTypesDto: CreateCommunicationTypesDto,
  ) {
    return await this.communicationTypeService.create(
      user,
      createCommunicationTypesDto,
    );
  }

  @Get('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAll(
    @Req() request: any,
    @Res() response: any,
    @CurrentUser() user: AuthUser,
  ) {
    const types = await this.communicationTypeService.getAll(
      user,
      request.queryParsed,
    );

    return response.status(HttpStatus.OK).json(types);
  }
}
