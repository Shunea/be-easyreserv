import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentService } from '../services/payment.service';
import { CreatePaymentAccountDto } from '../dto/create-payment-account.dto';
import { UpdatePaymentAccountDto } from '../dto/update-payment-account.dto';
import { RoleGuard } from '@src/auth/guards/role.guard';
import { Roles } from '@src/auth/decorators/roles.decorator';
import { Role } from '@src/user/enums/roles.enum';
import { AuthUser } from '@src/auth/decorators/auth-user.decorator';
import { AuthUser as AuthUserType } from '@src/auth/interfaces/auth-user.interface';
import { FilterPaymentDto } from '../dto/filter-payment.dto';
import { Response } from 'express';

@ApiTags('Payment Accounts')
@Controller('payment-accounts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  create(
    @Body() createPaymentAccountDto: CreatePaymentAccountDto,
    @AuthUser() operator: AuthUserType,
  ) {
    return this.paymentService.create(createPaymentAccountDto, operator);
  }

  @Get()
  @ApiQuery({ name: 'payment_type', required: false })
  @ApiQuery({ name: 'payment_status', required: false })
  @ApiQuery({ name: 'operator_id', required: false })
  @ApiQuery({ name: 'start_date', required: false, type: 'string' })
  @ApiQuery({ name: 'end_date', required: false, type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'restaurant_id', required: false })
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async findAll(@Query() filterDto: FilterPaymentDto, @AuthUser() user: AuthUserType) {
    // Ensure the filterDto includes the restaurant_id condition
    filterDto.restaurant_id = user.restaurantId;

    return this.paymentService.findAll(filterDto, user);
  }

  @Get('export')
  @ApiQuery({
    name: 'format',
    enum: ['csv', 'excel'],
    required: false,
    description: 'The format of the exported file',
  })
  async exportPayments(
    @Query() filterDto: FilterPaymentDto,
    @Query('format') format: 'csv' | 'excel' = 'excel',
    @Res() res: Response,
    @AuthUser() operator: AuthUserType,
  ) {
    const buffer = await this.paymentService.exportPayments(
      operator,
      filterDto,
      format,
    );

    const filename = `payments_export_${
      new Date().toISOString().split('T')[0]
    }`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${filename}.csv`,
      );
    } else {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${filename}.xlsx`,
      );
    }

    res.send(buffer);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  findOne(@Param('id') id: string, @AuthUser() operator: AuthUserType) {
    return this.paymentService.findOne(id, operator);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updatePaymentAccountDto: UpdatePaymentAccountDto,
    @AuthUser() operator: AuthUserType,
  ) {
    return this.paymentService.update(id, updatePaymentAccountDto, operator);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.paymentService.remove(id);
  }
}
