import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateTableDto } from '../dto/createTable.dto';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { Table } from '../entities/table.entity';
import { TableService } from '../services/table.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateTableDto } from '../dto/updateTable.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';

@ApiTags('Table')
@Controller('table')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class TableController {
  constructor(private readonly tableService: TableService) {}

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
  async getAll(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ): Promise<Table[]> {
    const tables = await this.tableService.getAll(request.queryParsed, user);
    return response.status(HttpStatus.OK).json(tables);
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
  async getById(@Param('id') id: string): Promise<Table> {
    return await this.tableService.getById(id);
  }

  @Get('/space/:spaceId')
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
  async getAllBySpaceId(
    @CurrentUser() user: AuthUser,
    @Param('spaceId') spaceId: string,
    @Query('date') date: string,
  ) {
    return await this.tableService.getAllBySpaceId(spaceId, user, date);
  }

  @Post(`/:spaceId`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async create(
    @Body() createTableDto: CreateTableDto,
    @Param('spaceId') spaceId: string,
  ) {
    return await this.tableService.create(createTableDto, spaceId);
  }

  @Put(`/:spaceId/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() body: UpdateTableDto,
  ): Promise<Table> {
    return await this.tableService.update(spaceId, id, body);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') id: string) {
    return await this.tableService.delete(id);
  }
}
