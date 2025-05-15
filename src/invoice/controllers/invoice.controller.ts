import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InvoiceService } from '@src/invoice/services/invoice.service';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { Role } from '@src/user/enums/roles.enum';
import { Plans } from '@src/plan/decorators/plan.decorator';
import { PlanType } from '@src/plan/enum/planType.enum';
import { CurrentUser } from '@src/user/decorators/current-user.decorator';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { PlanGuard } from '@src/plan/guards/plan.guard';
import { REGEX_UUID_VALIDATION } from '@src/constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Invoice } from '@src/invoice/entities/invoice.entity';
import { UpdateInvoiceDto } from '@src/invoice/dto/update-invoice.dto';

@ApiTags('Invoice')
@Controller('invoice')
@ApiBearerAuth()
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post('/')
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPER_ADMIN_EASYRESERV)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async create(@CurrentUser() user: AuthUser): Promise<Invoice> {
    return await this.invoiceService.create(user);
  }

  @ApiBearerAuth()
  @Get('/')
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPER_ADMIN_EASYRESERV)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAll(@Res() response: any): Promise<Invoice> {
    const invoices = await this.invoiceService.getAll();
    return response.status(HttpStatus.OK).json(invoices);
  }

  @ApiBearerAuth()
  @Get(`/:businessId(${REGEX_UUID_VALIDATION})`)
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPER_ADMIN_EASYRESERV)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getAllByBusinessId(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Res() response: any,
  ): Promise<Invoice[]> {
    const invoices = await this.invoiceService.getAllByBusinessId(
      user,
      businessId,
    );
    return response.status(HttpStatus.OK).json(invoices);
  }

  @ApiBearerAuth()
  @Get(`/:id(${REGEX_UUID_VALIDATION})`)
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPER_ADMIN_EASYRESERV)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async getById(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res() response: any,
  ): Promise<Invoice> {
    const invoice = await this.invoiceService.getById(id, user);
    return response.status(HttpStatus.OK).json(invoice);
  }

  @Put(`/:invoiceId(${REGEX_UUID_VALIDATION})`)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async update(
    @CurrentUser() user: AuthUser,
    @Param('invoiceId') invoiceId: string,
    @Body() body: UpdateInvoiceDto,
  ): Promise<Invoice> {
    return await this.invoiceService.update(user, invoiceId, body);
  }

  @Delete(`/:id(${REGEX_UUID_VALIDATION})`)
  @UseGuards(AuthGuard('jwt'), RoleGuard, PlanGuard, ThrottlerGuard)
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPER_ADMIN_EASYRESERV)
  @Plans(PlanType.BASIC, PlanType.STANDARD, PlanType.PRO)
  async delete(@Param('id') id: string) {
    return await this.invoiceService.delete(id);
  }
}
