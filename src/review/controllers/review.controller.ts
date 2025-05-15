import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { CreateReviewDto } from '../dto/createReview.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Review } from '../entities/review.entity';
import { ReviewService } from '../services/review.service';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateReviewDto } from '../dto/updateReview.dto';
import { StaffRole } from '@src/user/enums/staff.roles.enum';

@ApiTags('Review')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('/')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.WAITER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async create(@Body() body: CreateReviewDto, @CurrentUser() user: AuthUser) {
    return await this.reviewService.create(body, user);
  }

  @Get('/')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAll(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ): Promise<Review[]> {
    const reviews = await this.reviewService.getAll(user, request.queryParsed);
    return response.status(HttpStatus.OK).json(reviews);
  }

  @Get('/clients')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    StaffRole.WAITER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAllClientReviews(
    @CurrentUser() user: AuthUser,
    @Req() request: any,
    @Res() response: any,
  ): Promise<Review[]> {
    const reviews = await this.reviewService.getAllClientReviews(
      user,
      request.queryParsed,
    );
    return response.status(HttpStatus.OK).json(reviews);
  }

  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getById(
    @Param('id') id: string,
    @Res() response: any,
  ): Promise<Review> {
    return await this.reviewService.getById(id, response);
  }

  @Get(`/restaurant/:restaurantId(${REGEX_UUID_VALIDATION})`)
  async getAllByRestaurantId(
    @Param('restaurantId') restaurantId: string,
    @Req() request: any,
  ): Promise<Review> {
    return await this.reviewService.getAllByRestaurantId(
      restaurantId,
      request.queryParsed,
    );
  }

  @Get(`/reservation/:reservationId(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.USER,
    StaffRole.WAITER,
    StaffRole.HOSTESS,
    StaffRole.SUPER_HOSTESS,
    StaffRole.OPERATOR,
  )
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getReviewByReservationId(
    @Param('reservationId') restaurantId: string,
  ): Promise<Review> {
    return await this.reviewService.getReviewByReservationId(restaurantId);
  }

  @Get(`/category/restaurant/:restaurantId(${REGEX_UUID_VALIDATION})`)
  async getAllCategoryReviewsByRestaurantId(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: AuthUser,
    @Query('staff') staff: string,
  ): Promise<any> {
    return await this.reviewService.getAllCategoryReviewsByRestaurantId(
      restaurantId,
      user,
      staff,
    );
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateReviewDto,
    @Res() response: any,
  ): Promise<Review> {
    return await this.reviewService.update(id, body, response);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') id: string, @Res() response: any) {
    return await this.reviewService.delete(id, response);
  }
}
