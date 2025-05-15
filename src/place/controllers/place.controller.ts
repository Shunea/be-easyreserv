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
import { CreatePlaceDto } from '../dto/createPlace.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { Place } from '../entities/place.entity';
import { PlaceService } from '../services/place.service';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { StaffRole } from '@src/user/enums/staff.roles.enum';

@ApiTags('Place')
@Controller('place')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class PlaceController {
  constructor(private readonly placeService: PlaceService) {}

  @Post('/')
  @Roles(Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async createPlace(
    @CurrentUser() user: AuthUser,
    @Body() body: CreatePlaceDto,
  ) {
    return await this.placeService.createPlace(user, body);
  }

  @Get('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAll(
    @CurrentUser() user: AuthUser,
    @Res() response: any,
    @Req() request: any,
  ): Promise<Place> {
    const places = await this.placeService.getAllPlaces(
      user,
      request.queryParsed,
    );
    return response.status(HttpStatus.OK).json(places);
  }

  @Get('/all')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAllAboutPlaces(@CurrentUser() user: AuthUser): Promise<any> {
    return await this.placeService.getAllAboutPlaces(user);
  }

  @Get(`/all/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAllAboutPlacesById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<any> {
    return await this.placeService.getAllAboutPlaceById(id, user);
  }

  @Get('/current/all')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Roles(Role.SUPER_ADMIN, StaffRole.SUPER_HOSTESS)
  async getAllCurrentPlaces(@CurrentUser() user: AuthUser): Promise<any> {
    return await this.placeService.getAllCurrentPlaces(user);
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<Place> {
    return await this.placeService.getPlaceById(id, user);
  }

  @Put('/switch/:placeId/:restaurantId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, StaffRole.SUPER_HOSTESS)
  async switchPlace(
    @CurrentUser() user: AuthUser,
    @Param('placeId') placeId: string,
    @Param('restaurantId') restaurantId: string,
    @Req() request: Request,
  ): Promise<any> {
    return await this.placeService.switchPlace(
      placeId,
      restaurantId,
      user,
      request,
    );
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') id: string, @Res() response: any) {
    return await this.placeService.delete(id, response);
  }
}
