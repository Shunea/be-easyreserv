import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Res,
  HttpStatus,
  Param,
  Delete,
  Put,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateTokenKeyDto } from '../dto/createTokenKey.dto';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TokenKey } from '../entities/tokenKey.entity';
import { TokenKeyService } from '../services/tokenKey.service';
import { UpdateTokenKeyDto } from '../dto/updateTokenKey.dto';

@ApiTags('TokenKeys')
@Controller('token-key')
export class TokenKeyController {
  constructor(private readonly tokenKeyService: TokenKeyService) {}

  @Post('/')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  async create(
    @Req() request: any,
    @Body() createTokenKeyDto: CreateTokenKeyDto,
  ) {
    return await this.tokenKeyService.create(createTokenKeyDto, request);
  }

  @Get('/')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  async getAll(@Req() request: any, @Res() response: any) {
    const tokenKeys = await this.tokenKeyService.getAll(request.queryParsed);
    return response.status(HttpStatus.OK).json(tokenKeys);
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  async getById(
    @Param('id') id: string,
    @Res() response: any,
  ): Promise<TokenKey> {
    return await this.tokenKeyService.getById(id, response);
  }

  @Get('/check/:tokenKey')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async checkTokenKey(@Param('tokenKey') tokenKey: string): Promise<any> {
    return await this.tokenKeyService.checkTokenKey(tokenKey);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateTokenKeyDto,
    @Res() response: any,
  ): Promise<TokenKey> {
    return await this.tokenKeyService.update(id, body, response);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  async delete(@Param('id') id: string) {
    return await this.tokenKeyService.delete(id);
  }
}
