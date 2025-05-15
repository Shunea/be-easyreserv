import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '@src/invoice/entities/invoice.entity';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { ERROR_MESSAGES } from '@src/constants';
import { UpdateInvoiceDto } from '@src/invoice/dto/update-invoice.dto';
import { User } from '@src/user/entities/user.entity';
import { Place } from '@src/place/entities/place.entity';
import { PlanHistory } from '@src/plan/entities/planHistory.entity';
import { Plan } from '@src/plan/entities/plan.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { getFormatBillingPeriod } from '@src/invoice/helper/billing-period';
import { PaymentStatus } from '@src/invoice/enums/payment-status.enum';

@Injectable()
export class InvoiceService {
  private alias = 'invoice';

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Place)
    private placeRepository: Repository<Place>,
    @InjectRepository(PlanHistory)
    private planHistoryRepository: Repository<PlanHistory>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
  ) {}

  async create(user: AuthUser): Promise<Invoice> {
    const invoice = new Invoice();

    const existingUser = await this.userRepository.findOne({
      where: { id: user.id },
    });

    if (!existingUser) {
      throw new HttpException(
        ERROR_MESSAGES.placementNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const business = await this.placeRepository.findOne({
      where: { userId: user.id },
    });

    if (!business) {
      throw new HttpException(
        ERROR_MESSAGES.placeNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const restaurant = await this.restaurantRepository.findOne({
      where: { placeId: business.id },
    });

    if (!restaurant) {
      throw new HttpException(
        ERROR_MESSAGES.restaurantNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const planHistory = await this.planHistoryRepository.findOne({
      where: { userId: user.id },
    });

    if (!planHistory) {
      throw new HttpException(
        ERROR_MESSAGES.planHistoryNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const plan = await this.planRepository.findOne({
      where: { id: planHistory.planId },
    });

    if (!plan) {
      throw new HttpException(
        ERROR_MESSAGES.planNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    invoice.business = business;
    invoice.businessType = business.placeType;
    invoice.businessName = restaurant.name;
    invoice.subscriptionType = plan.type;
    invoice.subscriptionSum = plan.price;
    invoice.issueDate = new Date();

    if (planHistory.isTrialPeriod) {
      invoice.billingPeriod = getFormatBillingPeriod(
        planHistory.startTrialPeriod,
        planHistory.endTrialPeriod,
      );
      invoice.subscriptionSum = 0;
    } else {
      invoice.billingPeriod = getFormatBillingPeriod(
        planHistory.billingDate,
        planHistory.nextBillingDate,
      );
    }

    try {
      return await this.invoiceRepository.save(invoice);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async getAll(): Promise<any> {
    const invoices = await this.invoiceRepository
      .createQueryBuilder(this.alias)
      .select(['invoice'])
      .andWhere('invoice.deleted_at IS NULL')
      .getMany();

    if (!invoices.length) {
      throw new HttpException(
        ERROR_MESSAGES.placementNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return invoices;
  }

  async getAllByBusinessId(
    user: AuthUser,
    businessId: string,
  ): Promise<Invoice[]> {
    const business = await this.placeRepository.findOne({
      where: { userId: user.id },
    });

    if (business.id != businessId) {
      throw new HttpException(
        ERROR_MESSAGES.placeNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const invoices = await this.invoiceRepository
      .createQueryBuilder(this.alias)
      .select(['invoice'])
      .where('invoice.business_id = :business_id', { business_id: businessId })
      .andWhere('invoice.deleted_at IS NULL')
      .getMany();

    if (!invoices.length) {
      throw new HttpException(
        ERROR_MESSAGES.invoiceNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return invoices;
  }

  async getById(invoiceId: string, user: AuthUser): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: invoiceId,
        deletedAt: null,
      },
    });

    if (!invoice) {
      throw new HttpException(
        ERROR_MESSAGES.invoiceNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return invoice;
  }

  async update(
    user: AuthUser,
    invoiceId: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: {
          id: invoiceId,
          deletedAt: null,
        },
      });

      if (!invoice) {
        throw new HttpException(
          ERROR_MESSAGES.invoiceNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      if (
        !Object.values(PaymentStatus).includes(updateInvoiceDto.paymentStatus)
      ) {
        throw new HttpException(
          ERROR_MESSAGES.invalidPaymentStatus,
          HttpStatus.BAD_REQUEST,
        );
      }
      invoice.payment_status = updateInvoiceDto.paymentStatus;

      const updatedInvoice = this.invoiceRepository.create({
        ...invoice,
        ...updateInvoiceDto,
      });

      const result = await this.invoiceRepository.save(updatedInvoice);
      return result;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(invoiceId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: {
        id: invoiceId,
        deletedAt: null,
      },
    });

    if (!invoice) {
      throw new HttpException(
        ERROR_MESSAGES.invoiceNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.invoiceRepository.softRemove(invoice);

    return { deleted: true };
  }
}
