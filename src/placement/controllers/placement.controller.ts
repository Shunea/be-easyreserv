import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
import { PlacementService } from '@src/placement/services/placement.service';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { Role } from '@src/user/enums/roles.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { PlanType } from '@src/plan/enum/planType.enum';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreatePlacementDto } from '@src/placement/dto/create-placement.dto';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Placement } from '@src/placement/entities/placement.entity';
import { UpdatePlacementDto } from '@src/placement/dto/update-placement.dto';

@ApiTags('Placement')
@ApiBearerAuth()
@Controller('placement')
export class PlacementController {
  constructor(private placementService: PlacementService) {}

  @Post('/')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async createPlacement(
    @CurrentUser() user: AuthUser,
    @Body() body: CreatePlacementDto,
  ): Promise<Placement> {
    return await this.placementService.create(user, body);
  }

  @ApiBearerAuth()
  @Get('/')
  async getAll(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ): Promise<Placement> {
    const placements = await this.placementService.getAll(user);
    return response.status(HttpStatus.OK).json(placements);
  }

  @Get(`/all/:id(${REGEX_UUID_VALIDATION})`)
  async getById(
    @CurrentUser() user: AuthUser,
    @Res() response: any,
    @Param('id') id: string,
  ): Promise<Placement> {
    const placements = await this.placementService.getById(id, user);
    return response.status(HttpStatus.OK).json(placements);
  }

  @Get(`/image-gallery/:placementId(${REGEX_UUID_VALIDATION})`)
  async getImageGallery(@Param('placementId') placementId: string) {
    return await this.placementService.getImageGallery(placementId);
  }

  @Put(`/:placementId(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('placementId') placementId: string,
    @Body() body: UpdatePlacementDto,
  ): Promise<Placement> {
    return await this.placementService.update(user, placementId, body);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') id: string) {
    return await this.placementService.delete(id);
  }
}
