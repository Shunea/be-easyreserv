import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateSpaceItemDto } from '../dto/create_space-items.dto';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { SpaceItemsService } from '../services/space_items.service';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateSpaceItemDto } from '../dto/update_space-items.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';

@ApiTags('SpaceItem')
@Controller('space-items')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class SpaceItemsController {
  constructor(private readonly spaceItemsService: SpaceItemsService) {}

  @Post(`/:spaceId(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async create(
    @Body() createSpaceItemDto: CreateSpaceItemDto,
    @Param('spaceId') spaceId: string,
  ) {
    return await this.spaceItemsService.create(createSpaceItemDto, spaceId);
  }

  @Get(`/:spaceId(${REGEX_UUID_VALIDATION})`)
  @Roles(
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.USER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.OPERATOR,
    StaffRole.WAITER,
    StaffRole.SPECIALIST,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAll(
    @CurrentUser() user: AuthUser,
    @Param('spaceId') spaceId: string,
  ) {
    return await this.spaceItemsService.getAll(spaceId, user);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @Param('id') id: string,
    @Body() updateSpaceItemDto: UpdateSpaceItemDto,
  ) {
    return await this.spaceItemsService.update(id, updateSpaceItemDto);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') id: string) {
    return await this.spaceItemsService.delete(id);
  }
}
