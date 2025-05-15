import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  UseGuards,
  Res,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Category } from '../entities/category.entity';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dto/createCategory.dto';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateCategoryDto } from '../dto/updateCategory.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';

@ApiTags('Category')
@Controller('category')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return await this.categoryService.create(createCategoryDto);
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
    const category = await this.categoryService.getAll(restaurantId, user);
    return response.status(HttpStatus.OK).json(category);
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
  async getById(@Param('id') id: string): Promise<Category> {
    return await this.categoryService.getById(id);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
  ): Promise<Category> {
    return await this.categoryService.update(id, body);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') id: string) {
    return await this.categoryService.delete(id);
  }
}
