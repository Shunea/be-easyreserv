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
import { CreateFavoriteDto } from '../dto/createFavorite.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { Favorite } from '../entities/favorite.entity';
import { FavoriteService } from '../services/favorite.service';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateFavoriteDto } from '../dto/updateFavorite.dto';

@ApiTags('Favorite')
@Controller('favorite')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async create(@Body() body: CreateFavoriteDto, @CurrentUser() user: AuthUser) {
    return await this.favoriteService.create(body, user);
  }

  @Get('/')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAll(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ): Promise<Favorite[]> {
    const favorites = await this.favoriteService.getAll(
      user,
      request.queryParsed,
    );
    return response.status(HttpStatus.OK).json(favorites);
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getById(
    @Param('id') id: string,
    @Res() response: any,
  ): Promise<Favorite> {
    return await this.favoriteService.getById(id, response);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateFavoriteDto,
    @Res() response: any,
  ): Promise<Favorite> {
    return await this.favoriteService.update(id, body, response);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') id: string, @Res() response: any) {
    return await this.favoriteService.delete(id, response);
  }
}
