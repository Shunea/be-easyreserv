import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { PaymentAccount } from '../entities/payment-account.entity';
import { CreatePaymentAccountDto } from '../dto/create-payment-account.dto';
import { UpdatePaymentAccountDto } from '../dto/update-payment-account.dto';
import { AuthUser as AuthUserType } from '@src/auth/interfaces/auth-user.interface';
import { FilterPaymentDto } from '../dto/filter-payment.dto';
import * as ExcelJS from 'exceljs';
import { Parser } from 'json2csv';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(PaymentAccount)
    private paymentAccountRepository: Repository<PaymentAccount>
  ) {}

  async create(
    createPaymentAccountDto: CreatePaymentAccountDto,
    operator: AuthUserType,
  ): Promise<PaymentAccount> {
    try {
      const paymentAccount = this.paymentAccountRepository.create({
        ...createPaymentAccountDto,
        operator_id: operator.id,
        restaurant_id: operator.restaurantId,
        discount_value: createPaymentAccountDto.discount_percent
          ? (createPaymentAccountDto.amount *
              createPaymentAccountDto.discount_percent) /
            100
          : 0,
      });
      return await this.paymentAccountRepository.save(paymentAccount);
    } catch (error) {
      throw error;
    }
  }

  async findAll(
    filters: FilterPaymentDto,
    operator: AuthUserType,
  ): Promise<{ data: PaymentAccount[]; total: number }> {
    try {

      const queryBuilder = this.paymentAccountRepository
        .createQueryBuilder('payment_account')
        .leftJoinAndSelect('payment_account.operator', 'operator')
        .leftJoinAndSelect('payment_account.restaurant', 'restaurant')
        .select([
          'payment_account.id',
          'payment_account.receipt_number',
          'payment_account.order_id',
          'payment_account.payment_date',
          'payment_account.payment_type',
          'payment_account.amount',
          'payment_account.discount_percent',
          'payment_account.discount_value',
          'payment_account.payment_status',
          'payment_account.created_at',
          'payment_account.updated_at',
          'operator.id',
          'operator.username',
          'operator.email',
          'restaurant.id',
          'restaurant.name',
          'restaurant.address'
        ]);

      // Always filter by user's restaurant_id
      queryBuilder.where('payment_account.restaurant_id = :restaurant_id', { 
        restaurant_id: operator.restaurantId 
      });

      // Add filters if they exist
      if (filters.payment_type) {
        queryBuilder.andWhere('payment_account.payment_type = :payment_type', {
          payment_type: filters.payment_type,
        });
      }

      if (filters.payment_status) {
        queryBuilder.andWhere('payment_account.payment_status = :payment_status', {
          payment_status: filters.payment_status,
        });
      }

      if (filters.operator_id) {
        queryBuilder.andWhere('payment_account.operator_id = :operator_id', {
          operator_id: filters.operator_id,
        });
      }

      // Date range filter
      if (filters.start_date && filters.end_date) {
        queryBuilder.andWhere(
          'payment_account.payment_date BETWEEN :start_date AND :end_date',
          {
            start_date: filters.start_date,
            end_date: filters.end_date,
          },
        );
      }

      // Add pagination with defaults
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;
      
      queryBuilder.skip(skip).take(limit);

      // Order by creation date
      queryBuilder.orderBy('payment_account.created_at', 'DESC');

      // Get results and total count
      const [data, total] = await queryBuilder.getManyAndCount();
      

      return {
        data,
        total,
      };
    } catch (error) {
      this.logger.error('Error fetching payments:', error);
      this.logger.error('Error stack:', error.stack);
      throw error;
    }
  }

  async findOne(id: string, operator: AuthUserType): Promise<PaymentAccount> {
    const paymentAccount = await this.paymentAccountRepository
      .createQueryBuilder('payment_account')
      .leftJoinAndSelect(
        'user',
        'operator',
        'operator.id = payment_account.operator_id'
      )
      .leftJoinAndSelect(
        'restaurant',
        'restaurant',
        'restaurant.id = payment_account.restaurant_id'
      )
      .select([
        'payment_account.*',
        'operator.id',
        'operator.username',
        'operator.email',
        'restaurant.id',
        'restaurant.name',
        'restaurant.address'
      ])
      .where('payment_account.id = :id', { id })
      .andWhere('payment_account.restaurant_id = :restaurant_id', {
        restaurant_id: operator.restaurantId
      })
      .getRawOne();

    if (!paymentAccount) {
      throw new NotFoundException(`Payment account with ID ${id} not found`);
    }

    return this.transformRawPayment(paymentAccount);
  }

  // Helper method to transform raw SQL results
  private transformRawPayment(raw: any): PaymentAccount & { 
    operator?: { id: string; username: string; email: string };
    restaurant?: { id: string; name: string; address: string };
  } {
    return {
      ...raw,
      operator: raw.operator_id ? {
        id: raw.operator_id,
        username: raw.operator_username,
        email: raw.operator_email,
      } : undefined,
      restaurant: raw.restaurant_id ? {
        id: raw.restaurant_id,
        name: raw.restaurant_name,
        address: raw.restaurant_address,
      } : undefined,
    };
  }

  async update(
    id: string,
    updatePaymentAccountDto: UpdatePaymentAccountDto,
    operator: AuthUserType,
  ): Promise<PaymentAccount> {
    try {
      const paymentAccount = await this.findOne(id, operator);

      // Calculate new discount_value if amount or discount_percent is updated
      if (
        updatePaymentAccountDto.amount ||
        updatePaymentAccountDto.discount_percent
      ) {
        const amount = updatePaymentAccountDto.amount || paymentAccount.amount;
        const discountPercent =
          updatePaymentAccountDto.discount_percent ||
          paymentAccount.discount_percent;

        updatePaymentAccountDto.discount_value =
          (amount * discountPercent) / 100;
      }
      Object.assign(paymentAccount, updatePaymentAccountDto);

      const savedResult = await this.paymentAccountRepository.save(
        paymentAccount,
      );
      return savedResult;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.paymentAccountRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Payment account with ID ${id} not found`);
    }
  }

  async exportPayments(
    operator: AuthUserType,
    filters: FilterPaymentDto,
    format: 'csv' | 'excel',
  ): Promise<Buffer> {
    try {
      const payments = await this.paymentAccountRepository
        .createQueryBuilder('payment_account')
        .leftJoinAndSelect('payment_account.operator', 'operator')
        .leftJoinAndSelect('payment_account.restaurant', 'restaurant')
        .select([
          'payment_account',
          'operator.id',
          'operator.username',
          'operator.email',
          'restaurant.id',
          'restaurant.name',
          'restaurant.address'
        ])
        .where('payment_account.restaurant_id = :restaurant_id', {
          restaurant_id: operator.restaurantId,
        })
        // Add other filters
        .andWhere(filters.payment_type ? 'payment_account.payment_type = :payment_type' : '1=1', {
          payment_type: filters.payment_type,
        })
        .andWhere(filters.payment_status ? 'payment_account.payment_status = :payment_status' : '1=1', {
          payment_status: filters.payment_status,
        })
        .andWhere(filters.operator_id ? 'payment_account.operator_id = :operator_id' : '1=1', {
          operator_id: filters.operator_id,
        })
        .andWhere(
          filters.start_date && filters.end_date
            ? 'payment_account.payment_date BETWEEN :start_date AND :end_date'
            : '1=1',
          {
            start_date: filters.start_date,
            end_date: filters.end_date,
          },
        )
        .orderBy('payment_account.created_at', 'DESC')
        .getMany();

      if (payments.length === 0) {
        throw new NotFoundException('No payments found matching the specified criteria');
      }

      // Modify the export data to include operator and restaurant info
      const enrichedPayments = payments.map(payment => ({
        ...payment,
        operator_username: payment.operator?.username,
        operator_email: payment.operator?.email,
        restaurant_name: payment.restaurant?.name,
        restaurant_address: payment.restaurant?.address,
      }));

      if (format === 'csv') {
        return this.generateCSV(enrichedPayments);
      } else {
        return this.generateExcel(enrichedPayments);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to export payments');
    }
  }

  private async generateCSV(payments: any[]): Promise<Buffer> {
    try {
      const fields = [
        'id',
        'receipt_number',
        'order_id',
        'restaurant_id',
        'restaurant_name',
        'restaurant_address',
        'payment_date',
        'payment_type',
        'amount',
        'discount_percent',
        'discount_value',
        'payment_status',
        'operator_id',
        'operator_username',
        'operator_email',
        'created_at',
        'updated_at',
      ];

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(payments);
      return Buffer.from(csv);
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate CSV file');
    }
  }

  private async generateExcel(payments: any[]): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Payments');

      // Update columns to include operator and restaurant info
      worksheet.columns = [
        { header: 'Payment ID', key: 'id', width: 36 },
        { header: 'Receipt Number', key: 'receipt_number', width: 15 },
        { header: 'Order ID', key: 'order_id', width: 36 },
        { header: 'Restaurant ID', key: 'restaurant_id', width: 36 },
        { header: 'Restaurant Name', key: 'restaurant_name', width: 30 },
        { header: 'Restaurant Address', key: 'restaurant_address', width: 40 },
        { header: 'Payment Date', key: 'payment_date', width: 20 },
        { header: 'Payment Type', key: 'payment_type', width: 15 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Discount %', key: 'discount_percent', width: 12 },
        { header: 'Discount Value', key: 'discount_value', width: 12 },
        { header: 'Status', key: 'payment_status', width: 15 },
        { header: 'Operator ID', key: 'operator_id', width: 36 },
        { header: 'Operator Username', key: 'operator_username', width: 20 },
        { header: 'Operator Email', key: 'operator_email', width: 30 },
        { header: 'Created At', key: 'created_at', width: 20 },
        { header: 'Updated At', key: 'updated_at', width: 20 },
      ];

      // Add rows
      worksheet.addRows(payments);

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Format date columns
      const dateColumns = ['payment_date', 'created_at', 'updated_at'];
      payments.forEach((_, rowIndex) => {
        dateColumns.forEach((colKey) => {
          const cell = worksheet.getCell(`${colKey}${rowIndex + 2}`);
          cell.numFmt = 'yyyy-mm-dd hh:mm:ss';
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate Excel file');
    }
  }
}
