import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import { Communication } from '../entities/communication.entity';
import { CommunicationTypes } from '../entities/communication_types.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils, toTitleCase } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IFilter } from '@src/middlewares/QueryParser';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { JobEntity } from '@src/notification/entities/job.entity';
import { COMMUNICATION_QUEUE } from '@src/queues/constants';
import { NotificationService } from '@src/notification/services/notification.service';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
import { UpdateMessageDto } from '../dto/update-message.dto';
import { UserService } from '@src/user/services/user.service';
import { getPaginated } from '@src/common/pagination';
import { FilterMethods } from '../helper/filter-methods';
import { FilterClientsType } from '../helper/filter-clients.type';
import * as moment from 'moment';
import { ClientLanguage } from '@src/comunication/interfaces/communication.interfaces';
import { SmsService } from '@src/comunication/services/sms.service';

@Injectable()
export class CommunicationService {
  private alias = 'communication';
  private filter: IFilter = {};

  constructor(
    @InjectRepository(Communication)
    private readonly communicationRepository: Repository<Communication>,
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>,
    @InjectRepository(CommunicationTypes)
    private readonly communicationTypeRepository: Repository<CommunicationTypes>,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly smsService: SmsService,
    private readonly filterMethods: FilterMethods,
    @InjectQueue(COMMUNICATION_QUEUE) private notificationQueue: Queue,
  ) {
  }

  async sendMessages(senderAlias: string, receiverNumber: string, message: string) {

    let senderAliasEasy = 'EasyReserv';
    try {
      this.smsService.sendSms(senderAliasEasy, receiverNumber, message);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async create(
    user: AuthUser,
    createMessageDto: CreateMessageDto,
  ): Promise<Communication> {
    try {
      const existingMessage = await this.communicationRepository.findOne({
        where: {
          restaurantId: user.restaurantId,
          title: createMessageDto.title,
          deletedAt: null,
        },
      });

      if (existingMessage) {
        throw new HttpException(
          ERROR_MESSAGES.messageAlreadyExists,
          HttpStatus.BAD_REQUEST,
        );
      }

      const message = this.communicationRepository.create({
        ...createMessageDto,
        restaurantId: user.restaurantId,
      });
      await this.communicationRepository.save(message);

      const allClients = await this.userService.getAllClients(
        user,
        this.filter,
      );

      const filterMethodParams: FilterClientsType = {
        usersType: createMessageDto.userFilterDto.clientStatus,
        clients: allClients,
        dto: createMessageDto,
      };

      const filteredClientsIds = await this.filterMethods.getFilteredIds(
        filterMethodParams,
      );

      await this.handleNotificationSchedule(
        createMessageDto.sendMessageDate,
        filteredClientsIds,
        message,
      );

      return message;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getAll(user: AuthUser, filter: IFilter) {
    const { limit, skip, all } = filter;
    try {
      const queryBuilder = this.communicationRepository
        .createQueryBuilder(this.alias)
        .select([
          'communication.id as id',
          'communication.created_at as createdAt',
          'communication.updated_at as updatedAt',
          'communication.deleted_at as deletedAt',
          'communication.title as title',
          'communication.title_en as title_en',
          'communication.title_ro as title_ro',
          'communication.title_ru as title_ru',
          'communication.message as message',
          'communication.message_en as message_en',
          'communication.message_ro as message_ro',
          'communication.message_ru as message_ru',
          'communication.start_date as startDate',
          'communication.end_date as endDate',
          'communication.discount as discount',
          'communication.restaurant_id as restaurantId',
          'communication.send_message_date as sendMessageDate',
          'communication.communication_type_id as communicationTypeId',
          'communicationTypes.type as type',
        ])
        .leftJoin(
          'communication.communicationTypes',
          'communicationTypes',
          'communicationTypes.deleted_at IS NULL',
        )
        .where('communication.restaurant_id = :restaurantId', {
          restaurantId: user.restaurantId,
        })
        .andWhere('communication.deleted_at IS NULL');

      queryBuilder.orderBy('communication.start_date', 'ASC');

      FilterUtils.applyRangeFilter(
        queryBuilder,
        this.alias,
        'updated_at',
        filter,
      );
      FilterUtils.applyFilters(queryBuilder, this.alias, filter);
      FilterUtils.applySorting(queryBuilder, this.alias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getRawMany', filter);

      const messages = await queryBuilder.getRawMany();
      const countMessages = await queryBuilder.getCount();

      const result = getPaginated({
        data: messages,
        count: countMessages,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getById(messageId: string): Promise<Communication> {
    const message = await this.communicationRepository.findOne({
      where: { id: messageId, deletedAt: null },
    });

    if (!message) {
      throw new HttpException(
        ERROR_MESSAGES.messageNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    return message;
  }

  async update(
    user: AuthUser,
    messageId: string,
    updateMessageDto: UpdateMessageDto,
  ) {
    try {
      const message = await this.communicationRepository.findOne({
        where: { id: messageId, deletedAt: null },
      });

      if (!message) {
        throw new HttpException(
          ERROR_MESSAGES.messageNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      const updatedMessage = this.communicationRepository.create({
        ...message,
        ...updateMessageDto,
      });

      if (updateMessageDto.communicationTypeId) {
        const communicationType =
          await this.communicationTypeRepository.findOne({
            where: {
              id: updateMessageDto.communicationTypeId,
              deletedAt: null,
            },
          });
        updatedMessage.communicationTypes = communicationType;
      }
      await this.communicationRepository.save(updatedMessage);

      const allClients = await this.userService.getAllClients(
        user,
        this.filter,
      );

      const filterMethodParams: FilterClientsType = {
        usersType: updateMessageDto.userFilterDto.clientStatus,
        clients: allClients,
        dto: updateMessageDto,
      };

      const filteredClientsIds = await this.filterMethods.getFilteredIds(
        filterMethodParams,
      );

      try {
        await this.removeScheduledNotification(message.id);
      } catch (error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      const date = updateMessageDto.sendMessageDate
        ? updateMessageDto.sendMessageDate
        : message.sendMessageDate;

      await this.handleNotificationSchedule(date, filteredClientsIds, message);

      return updatedMessage;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(messageId: string) {
    const message = await this.communicationRepository.findOne({
      where: { id: messageId, deletedAt: null },
    });

    if (!message) {
      throw new HttpException(
        ERROR_MESSAGES.messageNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.removeScheduledNotification(message.id);
    await this.communicationRepository.softDelete(message.id);

    return { deleted: true };
  }

  async getAllMessageTypes(user: AuthUser) {
    const existingTypes = await this.communicationRepository
      .createQueryBuilder(this.alias)
      .where('communication.restaurant_id = :restaurantId', {
        restaurantId: user.restaurantId,
      })
      .andWhere('communication.deleted_at IS NULL')
      .select('DISTINCT(communication.type)', 'type')
      .orderBy('type', 'ASC')
      .getRawMany();

    const types = existingTypes.map((existingType) => existingType.type);
    return types;
  }

  async removeScheduledNotification(messageId: string) {
    const scheduledJobs = await this.jobRepository.find({
      where: { messageId: messageId, deletedAt: null },
    });

    for (const jobToRemove of scheduledJobs) {
      const job = await this.notificationQueue.getJob(jobToRemove.jobId);
      if (job) {
        await job.remove();
      }
    }
  }

  async handleNotificationSchedule(
    date: Date,
    filteredClientsIds: ClientLanguage[],
    message: Communication,
  ) {
    const sendMessageDate = moment(date);

    if (!sendMessageDate.isValid()) {
      throw new HttpException(
        ERROR_MESSAGES.invalidSendMessageDate,
        HttpStatus.BAD_REQUEST,
      );
    }

    const currentDate = moment(message.startDate)
      .hour(sendMessageDate.hour())
      .minute(sendMessageDate.minute());
    const finalDate = moment(message.endDate)
      .hour(sendMessageDate.hour())
      .minute(sendMessageDate.minute());

    await Promise.all(
      filteredClientsIds.map((client: ClientLanguage) => {
        while (currentDate.isSameOrBefore(finalDate)) {
          this.notificationService.sendScheduledNotifications(
            client.clientId,
            message[`title${toTitleCase(client.language)}`] || message.title,
            message[`message${toTitleCase(client.language)}`] ||
            message.message,
            currentDate.toDate(),
            message.id,
          );
          currentDate.add(1, 'days');
        }
      }),
    );
  }
}
