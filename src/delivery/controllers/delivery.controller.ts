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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Role } from '@src/user/enums/roles.enum';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { DeliveryService } from '../services/delivery.service';
import { CreateDeliveryOrderDto } from '../dto/create-delivery-order.dto';
import { UpdateDeliveryOrderDto } from '../dto/update-delivery-order.dto';
import { DeliveryOrder } from '../entities/delivery-order.entity';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { UpdateStatusDto } from '../dto/update-status.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';
import { DeliveryOrderResponseDto } from '../dto/delivery-order.response.dto';
import { plainToClass } from 'class-transformer';

@ApiTags('Delivery')
@Controller('delivery')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('/order')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Roles(StaffRole.OPERATOR, StaffRole.COURIER)
  @ApiResponse({ type: DeliveryOrderResponseDto })
  async create(
    @Req() request: any,
    @Body() createDeliveryOrderDto: CreateDeliveryOrderDto,
  ): Promise<DeliveryOrderResponseDto> {
    const order = await this.deliveryService.create(
      createDeliveryOrderDto,
      request,
    );
    return plainToClass(DeliveryOrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/orders')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Roles(StaffRole.OPERATOR, StaffRole.COURIER)
  @ApiResponse({ type: [DeliveryOrderResponseDto] })
  async getAll(@CurrentUser() user: AuthUser, @Req() request: any) {
    const orders = await this.deliveryService.getAll(user, request.queryParsed);
    return {
      ...orders,
      data: plainToClass(DeliveryOrderResponseDto, orders.data, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get(`/order/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Roles(StaffRole.OPERATOR, StaffRole.COURIER)
  @ApiResponse({ type: DeliveryOrderResponseDto })
  async getById(@Param('id') id: string): Promise<DeliveryOrderResponseDto> {
    const order = await this.deliveryService.getById(id);
    return plainToClass(DeliveryOrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Put(`/order/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Roles(StaffRole.OPERATOR, StaffRole.COURIER)
  @ApiResponse({ type: DeliveryOrderResponseDto })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDeliveryOrderDto,
  ): Promise<DeliveryOrderResponseDto> {
    const order = await this.deliveryService.update(id, body);
    return plainToClass(DeliveryOrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Put(`/order/:id(${REGEX_UUID_VALIDATION})/status`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Roles(StaffRole.OPERATOR, StaffRole.COURIER)
  @ApiOperation({ summary: 'Update delivery status' })
  @ApiResponse({ type: DeliveryOrderResponseDto })
  @ApiBody({ type: UpdateStatusDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser() user: AuthUser,
  ): Promise<DeliveryOrderResponseDto> {
    const order = await this.deliveryService.updateStatus(
      id,
      updateStatusDto.status,
      user,
      updateStatusDto.position,
    );
    return plainToClass(DeliveryOrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Put(`/order/:id(${REGEX_UUID_VALIDATION})/location`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Roles(StaffRole.COURIER)
  @ApiOperation({ summary: 'Update courier location' })
  @ApiResponse({ type: DeliveryOrderResponseDto })
  @ApiBody({ type: UpdateLocationDto })
  async updateCourierLocation(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @CurrentUser() user: AuthUser,
  ): Promise<DeliveryOrderResponseDto> {
    const order = await this.deliveryService.updateCourierLocation(
      id,
      updateLocationDto.latitude,
      updateLocationDto.longitude,
      user,
    );
    return plainToClass(DeliveryOrderResponseDto, order, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(`/order/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async delete(@Param('id') id: string) {
    return await this.deliveryService.delete(id);
  }

  @Get('/orders/available')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Roles(StaffRole.OPERATOR, StaffRole.COURIER)
  @ApiResponse({ type: [DeliveryOrderResponseDto] })
  async getAvailableOrders(@CurrentUser() user: AuthUser, @Req() request: any) {
    const orders = await this.deliveryService.getAvailableOrders(
      user,
      request.queryParsed,
    );
    return {
      ...orders,
      data: plainToClass(DeliveryOrderResponseDto, orders.data, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Get('/orders/active')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Roles(StaffRole.OPERATOR, StaffRole.COURIER)
  @ApiResponse({ type: [DeliveryOrderResponseDto] })
  async getActiveOrders(@CurrentUser() user: AuthUser, @Req() request: any) {
    const orders = await this.deliveryService.getActiveOrders(
      user,
      request.queryParsed,
    );
    return {
      ...orders,
      data: plainToClass(DeliveryOrderResponseDto, orders.data, {
        excludeExtraneousValues: true,
      }),
    };
  }
}
