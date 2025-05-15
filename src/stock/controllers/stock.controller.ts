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
import { CreateStockDto } from '../dto/create_stock.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StockService } from '../services/stock.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateStockDto } from '../dto/update_stock.dto';
import { CreateOrderForSuplierDto } from '../dto/create_suplier_order.dto';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiTags('Stock')
@Controller('stock')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post(`/:suplierId(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async create(
    @CurrentUser() user: AuthUser,
    @Param('suplierId') suplierId: string,
    @Body() createStockDto: CreateStockDto,
  ) {
    return await this.stockService.create(user, suplierId, createStockDto);
  }

  @Post(`/make-order-email/:suplierId(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async makeOrderEmail(
    @CurrentUser() user: AuthUser,
    @Param('suplierId') suplierId: string,
    @Body() createOrderForSuplierDto: CreateOrderForSuplierDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.stockService.createOrderToSuplierEmail(
      user,
      suplierId,
      createOrderForSuplierDto,
      i18n,
    );
  }

  @Post(`/make-order-telegram/:suplierId(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async makeOrderTelegram(
    @CurrentUser() user: AuthUser,
    @Param('suplierId') suplierId: string,
    @Body() createOrderForSuplierDto: CreateOrderForSuplierDto,
  ) {
    return await this.stockService.createOrderToSuplierTelegram(
      user,
      suplierId,
      createOrderForSuplierDto,
    );
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getById(@Param('id') id: string) {
    return await this.stockService.getById(id);
  }

  @Get(`/stock-with-suplier/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getStockWithSuplier(@Param('id') id: string) {
    return await this.stockService.getStockWithSuplier(id);
  }

  @Get('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async getAll(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ) {
    const stocks = await this.stockService.getAll(request.queryParsed, user);
    return response.status(HttpStatus.OK).json(stocks);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
  ) {
    return await this.stockService.update(user, id, updateStockDto);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.PRO)
  async delete(@Param('id') id: string) {
    return await this.stockService.delete(id);
  }
}
