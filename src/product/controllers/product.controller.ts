import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Res,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateProductDto } from '../dto/createProduct.dto';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { PlanType } from '@src/plan/enum/planType.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { Product } from '../entities/product.entity';
import { ProductService } from '../services/product.service';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { Role } from '@src/user/enums/roles.enum';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateProductDto } from '../dto/updateProduct.dto';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post(`/restaurant/:restaurantId(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async create(
    @Param('restaurantId') restaurantId: string,
    @Body() body: CreateProductDto,
    @Res() response: any,
  ) {
    const createdProduct = await this.productService.create(restaurantId, body);
    return response.status(HttpStatus.OK).json(createdProduct);
  }

  @Get(`/restaurant/:restaurantId(${REGEX_UUID_VALIDATION})`)
  async getAll(
    @CurrentUser() user: AuthUser,
    @Param('restaurantId') restaurantId: string,
    @Res() response: any,
  ) {
    const product = await this.productService.getAllByRestaurantId(
      restaurantId,
      user,
    );
    return response.status(HttpStatus.OK).json(product);
  }

  @Get(`/category/:categoryId/:restaurantId(${REGEX_UUID_VALIDATION})`)
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
  async findByCategoryId(
    @Param('categoryId') categoryId: string,
    @Param('restaurantId') restaurantId: string,
  ): Promise<any> {
    return await this.productService.findByCategoryIdAndRestaurantId(
      categoryId,
      restaurantId,
    );
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
  async findById(@Param('id') id: string, @Res() response: any): Promise<any> {
    const product = await this.productService.findById(id);
    return response.status(HttpStatus.OK).json(product);
  }

  @Put(`/:id(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @Res() response: any,
  ): Promise<Product> {
    try {
      const updatedProduct = await this.productService.update(id, body);
      const sanitizedProductIngredients = updatedProduct.productIngredients.map(
        (pi) => ({
          id: pi.id,
          quantity: pi.quantity,
        }),
      );

      const sanitizedProduct = {
        id: updatedProduct.id,
        title: updatedProduct.title,
        price: updatedProduct.price,
        weight: updatedProduct.weight,
        image: updatedProduct.image,
        preparationTime: updatedProduct.preparationTime,
        preparationZone: updatedProduct.preparationZone,
        allergens: updatedProduct.allergens,
        recipe: updatedProduct.recipe,
        category: {
          id: updatedProduct.category.id,
          name: updatedProduct.category.name,
        },
        productIngredients: sanitizedProductIngredients,
        restaurant: updatedProduct.restaurant,
      };

      return response.status(HttpStatus.OK).json(sanitizedProduct);
    } catch (error) {
      console.log(error);
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Put(`/:productId(${REGEX_UUID_VALIDATION})/:status`)
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
  async updateStatus(
    @Param('productId') productId: string,
    @Param('status') status: boolean,
  ): Promise<Product> {
    return await this.productService.updateStatus(productId, status);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') id: string) {
    return await this.productService.delete(id);
  }
}
