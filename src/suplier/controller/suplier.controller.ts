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
import { CreateSuplierDto } from '../dto/create_suplier.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { SuplierService } from '../services/suplier.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateSuplierDto } from '../dto/update_suplier.dto';

@ApiTags('Suplier')
@Controller('suplier')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class SuplierController {
  constructor(private readonly suplierService: SuplierService) {}

  @Post('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async createSuplier(
    @CurrentUser() user: any,
    @Body() createSuplierDto: CreateSuplierDto,
  ) {
    return await this.suplierService.create(user, createSuplierDto);
  }

  @Get('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getAllSupliers(
    @Req() request: any,
    @Res() response: any,
    @CurrentUser() user: any,
  ) {
    const supliers = await this.suplierService.getAll(
      request.queryParsed,
      user,
    );
    return response.status(HttpStatus.OK).json(supliers);
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getById(@Param('id') id: string) {
    return await this.suplierService.getById(id);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateSuplierDto: UpdateSuplierDto,
  ) {
    return await this.suplierService.update(user, id, updateSuplierDto);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async delete(@Param('id') id: string) {
    return await this.suplierService.delete(id);
  }
}
