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
import { CreateSpaceDto } from '../dto/createSpace.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { Space } from '../entities/space.entity';
import { SpaceService } from '../services/space.service';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateSpaceDto } from '../dto/updateSpace.dto';

@ApiTags('Space')
@Controller('space')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class SpaceController {
  constructor(private readonly spaceService: SpaceService) {}

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
  async getAllSpaces(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ): Promise<Space> {
    const spaces = await this.spaceService.getAllSpaces(
      user,
      request.queryParsed,
    );
    return response.status(HttpStatus.OK).json(spaces);
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
  async getSpaceById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<Space> {
    return await this.spaceService.getSpaceById(id, user);
  }

  @Post('/:placeId/:restaurantId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async createSpace(
    @Param('placeId') placeId: string,
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: AuthUser,
    @Body() createSpaceDto: CreateSpaceDto,
  ) {
    return await this.spaceService.createSpace(
      placeId,
      restaurantId,
      user,
      createSpaceDto,
    );
  }

  @Put('/:placeId/:restaurantId/:spaceId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async updateSpace(
    @CurrentUser() user: AuthUser,
    @Param('placeId') placeId: string,
    @Param('restaurantId') restaurantId: string,
    @Param('spaceId') spaceId: string,
    @Body() updateSpaceDto: UpdateSpaceDto,
  ) {
    return await this.spaceService.updateSpace(
      user,
      placeId,
      restaurantId,
      spaceId,
      updateSpaceDto,
    );
  }

  @Delete('/:spaceId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async deleteSpace(@Param('spaceId') spaceId: string) {
    return await this.spaceService.deleteSpace(spaceId);
  }

  @Delete('all-spaces/:restaurantId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async deleteAllSpaces(@Param('restaurantId') restaurantId: string) {
    return await this.spaceService.deleteAllSpaces(restaurantId);
  }
}
