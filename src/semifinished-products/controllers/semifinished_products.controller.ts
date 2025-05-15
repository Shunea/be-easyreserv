import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SemifinishedProductsService } from '@src/semifinished-products/services/semifinished_products.service';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { Role } from '@src/user/enums/roles.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { PlanType } from '@src/plan/enum/planType.enum';
import { CreateSemifinishedProductDto } from '@src/semifinished-products/dto/create-semifinished-product.dto';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { SemifinishedProduct } from '@src/semifinished-products/entities/semifinished-product.entity';
import { UpdateSemifinishedProductDto } from '@src/semifinished-products/dto/update-semifinished-product.dto';

@ApiTags('Semifinished-products')
@Controller('semifinished-products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class SemifinishedProductsController {

  constructor(private readonly semifinishedProductsService: SemifinishedProductsService) {
  }

  @Post(`/restaurant/:restaurantId(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async create(@Param('restaurantId') restaurantId: string,
               @Body() createSemifinishedProductDto: CreateSemifinishedProductDto) {
    return await this.semifinishedProductsService.create(restaurantId, createSemifinishedProductDto);
  }


  @Get(`/restaurant/:restaurantId(${REGEX_UUID_VALIDATION})`)
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
    @Param('restaurantId') restaurantId: string,
    @Res() response: any,
  ) {
    const semifinishedProducts = await this.semifinishedProductsService.getAllByRestaurantId(
      restaurantId,
      user,
    );
    return response.status(HttpStatus.OK).json(semifinishedProducts);
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
  async getById(@Param('id') id: string): Promise<SemifinishedProduct> {
    return await this.semifinishedProductsService.getById(id);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateSemifinishedProductDto,
  ): Promise<SemifinishedProduct> {
    return await this.semifinishedProductsService.update(id, body);
  }

  @Delete(`/semifinishedProduct/:semifinishedProductId`)
  async delete(
    @Param('semifinishedProductId') semifinishedProductId: string,
  ) {
    return await this.semifinishedProductsService.delete(
      semifinishedProductId,
    );
  }

}
