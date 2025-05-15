import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  MessageEvent,
  Param,
  Post,
  Put,
  Req,
  Res,
  Sse,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateOrderDto } from '../dto/createOrder.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { DeleteOrderDto } from '../dto/deleteOrders.dto';
import { FilterOrderDto } from '../dto/filter-order.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Order } from '../entities/order.entity';
import { OrderService } from '../services/order.service';
import { OrderStatus } from '../enums/orderStatus.enum';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { PreparationZones } from '@src/product/enums/preparation-zones.enum';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateOrderDto } from '../dto/updateOrder.dto';
import { Observable } from 'rxjs';

@ApiTags('Order')
@Controller('order')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Get all orders',
    description: 'Get all orders with optional filters for status and preparation zone'
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: OrderStatus,
    description: 'Filter by order status'
  })
  @ApiQuery({ 
    name: 'preparationZone', 
    required: false, 
    enum: PreparationZones,
    description: 'Filter by preparation zone'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: 'number',
    description: 'Page number for pagination'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: 'number',
    description: 'Number of records per page'
  })
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
    StaffRole.BARTENDER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAll(
    @CurrentUser() user: AuthUser,
    @Query() filterDto: FilterOrderDto,
  ) {
    return await this.orderService.getAll(user, filterDto);
  }

  @Get(`/:reservationId(${REGEX_UUID_VALIDATION})`)
  @ApiOperation({
    summary: 'Get orders by reservation',
    description: 'Get orders for a specific reservation with optional filters'
  })
  @ApiParam({
    name: 'reservationId',
    description: 'Reservation ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: OrderStatus,
    description: 'Filter by order status'
  })
  @ApiQuery({ 
    name: 'preparationZone', 
    required: false, 
    enum: PreparationZones,
    description: 'Filter by preparation zone'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: 'number',
    description: 'Page number for pagination'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: 'number',
    description: 'Number of records per page'
  })
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
    StaffRole.BARTENDER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getByReservation(
    @Param('reservationId') reservationId: string,
    @Query() filterDto: FilterOrderDto,
  ) {
    return await this.orderService.getByReservation(reservationId, filterDto);
  }

  @Post(`/:reservationId(${REGEX_UUID_VALIDATION})`)
  @ApiOperation({ summary: 'Create new orders for a reservation' })
  @ApiParam({
    name: 'reservationId',
    description: 'Reservation ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    type: [CreateOrderDto],
    description: 'Array of orders to create',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders created successfully',
    type: [CreateOrderDto],
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.WAITER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async createOrder(
    @CurrentUser() user: AuthUser,
    @Body() orderDto: CreateOrderDto[],
    @Param('reservationId') reservationId: string,
    @Res() response: any,
    @I18n() i18n: I18nContext,
  ) {
    const order = await this.orderService.create(
      user,
      orderDto,
      reservationId,
      i18n,
    );
    return response.status(HttpStatus.OK).json(order);
  }

  @Put(`/:orderId(${REGEX_UUID_VALIDATION})`)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.WAITER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.BARTENDER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
    @Body() updateDto: UpdateOrderDto,
  ): Promise<Order> {
    return await this.orderService.update(user, orderId, updateDto);
  }

  @Put(`/status/:orderId(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, StaffRole.CHEF, StaffRole.SOUS_CHEF, StaffRole.BARTENDER)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async updateStatus(
    @Param('orderId') orderId: string,
    @CurrentUser() user: AuthUser,
    @Body() updateDto: UpdateOrderDto,
    @I18n() i18n: I18nContext,
    @Res() response: any,
  ): Promise<Order> {
    return await this.orderService.updateStatus(
      orderId,
      user,
      updateDto,
      i18n,
      response,
    );
  }

  @Delete(`/:reservationId(${REGEX_UUID_VALIDATION})`)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.WAITER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(
    @CurrentUser() user: AuthUser,
    @Body() deleteOrderDto: DeleteOrderDto,
    @Param('reservationId') reservationId: string,
  ) {
    return await this.orderService.delete(user, deleteOrderDto, reservationId);
  }

  @Sse('/events')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, StaffRole.CHEF, StaffRole.SOUS_CHEF, StaffRole.BARTENDER, StaffRole.WAITER)
  sse(): Observable<MessageEvent> {
    return this.orderService.subscribeToOrders();
  }

  @Get('/history')
  @ApiOperation({
    summary: 'Get order history',
    description: 'Get all orders without grouping by reservations, excluding PENDING and PREPARING orders',
  })
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
    StaffRole.BARTENDER,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  @ApiQuery({ name: 'preparationZone', required: false })
  async getHistory(
    @CurrentUser() user: AuthUser,
    @Query() filterDto: FilterOrderDto,
  ) {
    return await this.orderService.getHistory(user, filterDto);
  }
}
