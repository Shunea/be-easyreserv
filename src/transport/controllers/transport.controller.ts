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
import { Roles } from '@src/auth/decorators/roles.decorator';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { PlanType } from '@src/plan/enum/planType.enum';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { Role } from '@src/user/enums/roles.enum';
import { CreateTransportDto } from '../dto/createTransport.dto';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { TransportService } from '../services/transport.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { UpdateTransportDto } from '../dto/updateTransport.dto';

@ApiTags('Transport')
@Controller('transport')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Post('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createTransportDto: CreateTransportDto,
  ) {
    return await this.transportService.create(user, createTransportDto);
  }

  @Get('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getAll(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ) {
    const transports = await this.transportService.getAll(
      user,
      request.queryParsed,
    );
    return response.status(HttpStatus.OK).json(transports);
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return await this.transportService.getById(id, user);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async update(
    @Param('id') id: string,
    @Body() updateTransportDto: UpdateTransportDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.transportService.update(id, updateTransportDto, user);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.transportService.delete(id, user);
  }
}
