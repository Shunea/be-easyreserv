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
import { CreateRestaurantDto } from '../dto/createRestaurant.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { GetCoordinates } from '@src/common/geolocation/getCoordinatesByAddress';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Restaurant } from '../entities/restaurant.entity';
import { RestaurantService } from '../services/restaurant.service';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateRestaurantDto } from '../dto/updateRestaurant.dto';

@ApiTags('Restaurant')
@Controller('restaurant')
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly geoService: GetCoordinates,
  ) {}

  @Get('/')
  async getAll(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ): Promise<Restaurant[]> {
    const restaurants = await this.restaurantService.getAll(
      request.queryParsed,
      user,
    );
    return response.status(HttpStatus.OK).json(restaurants);
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
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
  async getById(@Param('id') id: string): Promise<Restaurant> {
    return await this.restaurantService.getById(id);
  }

  @Get(`/get_spaces/:id(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.CHEF,
    StaffRole.WAITER,
  )
  async getSpacesByRestaurantId(@Param('id') id: string) {
    return await this.restaurantService.getAllSpacesByRestaurantId(id);
  }

  @Get(`/tables/:id/:date/:startTime/:endTime`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
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
  async getTablesStatus(
    @Param(`id`) id: string,
    @Param('date') date: Date,
    @Param('startTime') startTime: Date,
    @Param('endTime') endTime: Date,
  ) {
    return await this.restaurantService.checkTablesAvailability(
      id,
      date,
      startTime,
      endTime,
    );
  }

  @Get('/nearby/:lat/:lon/:radius')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getRestaurantsInRadius(
    @Param('lat') lat: number,
    @Param('lon') lon: number,
    @Param('radius') radius: number,
    @Res() response: any,
  ) {
    const restaurants = await this.restaurantService.findRestaurantInRadius(
      lat,
      lon,
      radius,
    );
    return response.status(HttpStatus.OK).json(restaurants);
  }

  @Get('/address-hints/:address')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  async getByAddress(@Param('address') address: string) {
    return await this.geoService.getAutoCompleteHints(address);
  }

  @Get('/:field')
  async getRestaurantField(@Param('field') field: string) {
    return await this.restaurantService.getRestaurantField(field);
  }

  @Get(`/image-gallery/:restaurantId(${REGEX_UUID_VALIDATION})`)
  async getImageGallery(@Param('restaurantId') restaurantId: string) {
    return await this.restaurantService.getImageGallery(restaurantId);
  }

  @Post('/:lat/:lon')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createRestaurantDto: CreateRestaurantDto,
    @Param('lat') lat: number,
    @Param('lon') lon: number,
  ) {
    return await this.restaurantService.create(
      user,
      createRestaurantDto,
      lat,
      lon,
    );
  }

  @Put(`/:placeId/:restaurantId(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('placeId') placeId: string,
    @Param('restaurantId') restaurantId: string,
    @Body() body: UpdateRestaurantDto,
  ): Promise<Restaurant> {
    return await this.restaurantService.update(
      user,
      placeId,
      restaurantId,
      body,
    );
  }

  @Delete(`/:placeId/:restaurantId(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(
    @Param('placeId') placeId: string,
    @Param('restaurantId') restaurantId: string,
  ) {
    return await this.restaurantService.delete(placeId, restaurantId);
  }
}
