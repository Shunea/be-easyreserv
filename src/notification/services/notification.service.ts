import * as moment from 'moment';
import firebase from '../config/firebase.config';
import gre from '@src/common/globalRegEx';
import prettify from '@src/common/prettify';
import { AuthUser } from '@src/auth/interfaces/auth-user.interface';
import {
  COMMUNICATION_QUEUE,
  SCHEDULE_NOTIFICATION,
} from '../../queues/constants';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { ERROR_MESSAGES } from '@src/constants';
import { FilterUtils } from '@src/common/utils';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { IFilter } from '@src/middlewares/QueryParser';
import { In, Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { JobEntity } from '../entities/job.entity';
import { Notification } from '../entities/notification.entity';
import { NotificationStatus } from '../enum/notification-status.enum';
import { NotificationToken } from '../entities/notification-token.entity';
import { Queue } from 'bull';
import { ReservationStatus } from '@src/reservation/enums/reservationStatus.enum';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { User } from '@src/user/entities/user.entity';
import { getPaginated } from '@src/common/pagination';
import { plainToClass } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationService {
  private logger: Logger;

  private notificationAlias = 'notification';
  private notificationTokenAlias = 'notification_token';
  private userAlias = 'user';

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationToken)
    private readonly notificationTokenRepository: Repository<NotificationToken>,
    @InjectRepository(JobEntity)
    private readonly jobRepository: Repository<JobEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly i18n: I18nService,

    @InjectQueue(COMMUNICATION_QUEUE) private notificationQueue: Queue,
  ) {
    this.logger = new Logger(NotificationService.name);
  }

  async getAllNotifications(
    user: AuthUser,
    filter: IFilter,
  ): Promise<Notification[]> {
    const { limit, skip, all } = filter;
    const columns = ['title', 'body'];

    try {
      const notificationTokens = await this.notificationTokenRepository.find({
        where: { userId: user.id, deletedAt: null },
      });

      const notificationTokenIds = notificationTokens.map(
        (notificationToken) => notificationToken.id,
      );

      const queryBuilder = this.notificationRepository.createQueryBuilder(
        this.notificationAlias,
      );

      queryBuilder
        .where(
          'notification.notification_token_id IN (:...notificationTokenIds)',
          { notificationTokenIds: [null, ...notificationTokenIds] },
        )
        .andWhere('notification.deleted_at IS NULL');

      FilterUtils.applyFilters(queryBuilder, this.notificationAlias, filter);
      FilterUtils.applySearch(
        queryBuilder,
        this.notificationAlias,
        filter,
        columns,
      );

      queryBuilder
        .groupBy('notification.id')
        .orderBy('notification.createdAt', 'DESC');

      FilterUtils.applySorting(queryBuilder, this.notificationAlias, filter);
      FilterUtils.applyPagination(queryBuilder, 'getMany', filter);

      const notificationsCount = await queryBuilder.getCount();
      const notifications = await queryBuilder.getMany();

      const translatedNotifications = await this.retranslateNotifications(
        user.id,
        notifications,
      );

      const result = getPaginated({
        data: translatedNotifications,
        count: notificationsCount,
        skip,
        limit,
        all,
      });

      return prettify(result);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getNotificationStatus(userId: string): Promise<Notification[]> {
    try {
      const notificationTokens = await this.notificationTokenRepository
        .createQueryBuilder(this.notificationTokenAlias)
        .where('notification_token.user_id = :userId', { userId })
        .andWhere('notification_token.deleted_at IS NULL')
        .getMany();

      return prettify(notificationTokens);
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async enableNotification(
    userId: string,
    createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationToken> {
    try {
      let existingToken = await this.notificationTokenRepository
        .createQueryBuilder(this.notificationTokenAlias)
        .where('notification_token.user_id = :userId', { userId })
        .andWhere('notification_token.device_type = :deviceType', {
          deviceType: createNotificationDto.deviceType,
        })
        .andWhere('notification_token.deleted_at IS NULL')
        .getOne();

      if (existingToken) {
        existingToken = plainToClass(NotificationToken, {
          ...existingToken,
          deviceToken: createNotificationDto.deviceToken,
          status: NotificationStatus.ACTIVE,
        });

        return await this.notificationTokenRepository.save(existingToken);
      }

      const notificationToken = plainToClass(NotificationToken, {
        userId,
        ...createNotificationDto,
        status: NotificationStatus.ACTIVE,
      });

      return await this.notificationTokenRepository.save(notificationToken);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async refreshDeviceToken(
    user: AuthUser,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<any> {
    try {
      const notificationTokens = await this.notificationTokenRepository
        .createQueryBuilder(this.notificationTokenAlias)
        .where('notification_token.user_id = :userId', { userId: user.id })
        .andWhere('notification_token.device_type = :deviceType', {
          deviceType: updateNotificationDto.deviceType,
        })
        .andWhere('notification_token.deleted_at IS NULL')
        .getMany();

      const oldDeviceTokens = notificationTokens.map(
        ({ deviceToken }) => deviceToken,
      );

      if (oldDeviceTokens && oldDeviceTokens.length === 0) {
        return { refreshed: false };
      }

      await this.notificationTokenRepository.update(
        { deviceToken: In(oldDeviceTokens) },
        { deviceToken: updateNotificationDto.deviceToken },
      );

      return { refreshed: true };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async disableNotification(
    userId: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<NotificationToken> {
    try {
      const notificationToken = await this.notificationTokenRepository
        .createQueryBuilder(this.notificationTokenAlias)
        .where('notification_token.user_id = :userId', { userId })
        .andWhere('notification_token.device_type = :deviceType', {
          deviceType: updateNotificationDto.deviceType,
        })
        .andWhere('notification_token.deleted_at IS NULL')
        .getOne();

      if (!notificationToken) {
        throw new HttpException(
          ERROR_MESSAGES.notificationTokenNotFound,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.notificationTokenRepository.update(
        { userId, deviceType: updateNotificationDto.deviceType },
        { status: NotificationStatus.INACTIVE },
      );

      return { ...notificationToken, ...updateNotificationDto };
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async delete(notificationId: string) {
    const notification = await this.notificationRepository
      .createQueryBuilder(this.notificationAlias)
      .where('notification.id = :notificationId', { notificationId })
      .andWhere('notification.deleted_at IS NULL')
      .getOne();

    if (!notification) {
      throw new HttpException(
        ERROR_MESSAGES.messageNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.notificationRepository.softDelete(notification.id);

    return { deleted: true };
  }

  async sendNotification(
    userId: string,
    title: string,
    body: string,
    placeholder?: any,
  ): Promise<void> {
    try {
      const notifications = [];
      const messaging = firebase.messaging();

      const notificationTokens = await this.notificationTokenRepository
        .createQueryBuilder(this.notificationTokenAlias)
        .where('notification_token.user_id = :userId', { userId })
        .andWhere('notification_token.status = :status', {
          status: NotificationStatus.ACTIVE,
        })
        .andWhere('notification_token.deleted_at IS NULL')
        .getMany();

      if (!notificationTokens || notificationTokens.length === 0) {
        return;
      }

      await Promise.all(
        notificationTokens.map(async (notificationToken) => {
          try {
            await messaging.send({
              token: notificationToken.deviceToken,
              notification: { title, body: this.replaceUnicodes(body) },
              android: { notification: { sound: 'notification.wav' } },
              apns: { payload: { aps: { sound: 'notification.aiff' } } },
            });

            const notification = plainToClass(Notification, {
              title,
              body,
              ...(placeholder && { placeholder }),
              notificationTokenId: notificationToken.id,
            });

            notifications.push(notification);
          } catch (error) {
            this.logger.error(
              `Oops! Error sending notification for token ${notificationToken.id}: ${error.message}`,
            );
          }
        }),
      );

      await this.notificationRepository.save(notifications);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  public async sendScheduledNotifications(
    userId: string,
    title: string,
    body: any,
    date: Date,
    messageId: string,
  ): Promise<void> {
    try {
      const now = moment();
      const sendMessageDate = moment(date);
      const delay = sendMessageDate.toDate().getTime() - now.toDate().getTime();
      const uniqueJobId: string = uuidv4();

      if (delay < 0) {
        throw new HttpException(
          ERROR_MESSAGES.scheduledTimeInPast,
          HttpStatus.BAD_REQUEST,
        );
      }

      const job = await this.notificationQueue.add(
        SCHEDULE_NOTIFICATION,
        {
          userId,
          title,
          body,
        },
        { delay, jobId: uniqueJobId },
      );

      const newJob = new JobEntity();
      newJob.jobId = job.id.toString();
      newJob.messageId = messageId;

      await this.jobRepository.save(newJob);
    } catch (error) {
      throw new HttpException(
        `${ERROR_MESSAGES.errorQueueingForUser} ${userId}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  public async sendReservationNotification(
    data: any,
    i18n: any,
  ): Promise<void> {
    try {
      const { user, reservation, isReservationCreate, isStatusChange } = data;
      const {
        restaurantId,
        restaurantName: reservationPlace,
        status: reservationStatus,
        date: reservationDate,
        clientName,
        waiterId,
        clientId,
      } = reservation;
      const excludedStatuses = [
        ReservationStatus.CONFIRMED_PREORDER,
        ReservationStatus.PENDING_PREORDER,
        ReservationStatus.SERVE_PREORDER,
      ];
      const staffRoles = [
        StaffRole.WAITER,
        StaffRole.SUPER_HOSTESS,
        StaffRole.HOSTESS,
      ];

      const isStaff = staffRoles.includes(user.role as StaffRole);
      const userId = isStaff ? clientId : user.id;
      const isVerifiedUser = await this.checkVerifiedUser(userId);

      if (
        !isVerifiedUser ||
        (isStatusChange && excludedStatuses.includes(reservationStatus))
      ) {
        return;
      }

      const clientMessageKey =
        !isStaff && isReservationCreate
          ? 'translation.notification.clientPendingReservation'
          : isStaff && (isReservationCreate || isStatusChange)
          ? 'translation.notification.clientStatusReservation'
          : 'translation.notification.clientChangeReservation';

      if (clientMessageKey) {
        const { title, message, placeholder } =
          await this.getReservationNotificationTitleAndMessage(
            userId,
            { message: clientMessageKey, reservationPlace, reservationStatus },
            i18n,
          );

        await this.sendNotification(userId, title, message, placeholder);
      }

      if (!isStaff) {
        const staffIds = waiterId
          ? (await this.getRestaurantSatffIds(restaurantId)).filter(
              (id) => waiterId === id,
            )
          : await this.getRestaurantSatffIds(restaurantId);

        const staffMessageKey = isReservationCreate
          ? 'translation.notification.staffPendingReservation'
          : reservationStatus === ReservationStatus.CANCELLED
          ? 'translation.notification.staffCancelledReservation'
          : 'translation.notification.staffChangeReservation';

        await Promise.all(
          staffIds.map(async (staffId) => {
            try {
              const { title, message, placeholder } =
                await this.getReservationNotificationTitleAndMessage(
                  staffId,
                  {
                    message: staffMessageKey,
                    clientName,
                    reservationDate,
                    reservationStatus,
                  },
                  i18n,
                );

              await this.sendNotification(staffId, title, message, placeholder);
            } catch (error) {
              throw new HttpException(
                ERROR_MESSAGES.notificationSendingError,
                HttpStatus.BAD_REQUEST,
              );
            }
          }),
        );
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  public async sendReservationOrderNotification(
    data: any,
    i18n: any,
  ): Promise<void> {
    try {
      const { restaurantId, waiterId, staffRole, tableNames } = data;

      if (!restaurantId) return;

      const isNewOrder = !this.isChefOrBartender(staffRole);
      const isOrderReady = this.isChefOrBartender(staffRole);

      if (isNewOrder) {
        await this.handleNewOrderNotification(data, i18n, tableNames);
      }

      if (isOrderReady) {
        await this.handleOrderReadyNotification(
          data,
          i18n,
          tableNames,
          waiterId,
        );
      }
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async getRestaurantSatffIds(restaurantId: string): Promise<string[]> {
    const waiters = await this.userRepository
      .createQueryBuilder(this.userAlias)
      .where('user.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('user.role IN (:...roles)', {
        roles: [StaffRole.WAITER, StaffRole.SUPER_HOSTESS, StaffRole.HOSTESS],
      })
      .andWhere('user.is_verified = true')
      .andWhere('user.deleted_at IS NULL')
      .getMany();

    const waiterIds = waiters.map(({ id }) => id);

    return waiterIds;
  }

  private async getReservationNotificationTitleAndMessage(
    userId: string,
    reservationData: any,
    i18n: any,
  ): Promise<any> {
    let {
      message,
      clientName,
      reservationPlace,
      reservationStatus,
      reservationDate,
    } = reservationData;
    const { language } = await this.userRepository
      .createQueryBuilder(this.userAlias)
      .where('user.id = :userId', { userId })
      .andWhere('user.deleted_at IS NULL')
      .getOne();

    i18n.lang = language;

    const messageTranslations = {
      'translation.notification.clientPendingReservation': [
        '{reservationPlace}',
      ],
      'translation.notification.clientStatusReservation': [
        '{reservationPlace}',
        '{reservationStatus}',
      ],
      'translation.notification.clientChangeReservation': [
        '{reservationPlace}',
      ],
      'translation.notification.staffChangeReservation': ['{clientName}'],
      'translation.notification.staffCancelledReservation': [
        '{clientName}',
        '{reservationDate}',
      ],
      'translation.notification.staffPendingReservation': [],
    };

    const { statusTranslation } = this.translateReservationStatus(
      reservationStatus,
      i18n,
    );

    const placeholders = {
      '{clientName}': clientName,
      '{reservationPlace}': reservationPlace,
      '{reservationStatus}': statusTranslation,
      '{reservationDate}': moment(reservationDate).format('DD.MM.YYYY HH:mm'),
    };

    const translationKey = Object.keys(messageTranslations).find(
      (key) => key === message,
    );

    if (translationKey) {
      const placeholdersToReplace = messageTranslations[translationKey];
      message = i18n.t(translationKey);

      placeholdersToReplace.forEach((placeholder) => {
        message = message.replace(placeholder, placeholders[placeholder]);
      });

      for (const key in placeholders) {
        if (!placeholdersToReplace.includes(key)) {
          delete placeholders[key];
        }
      }

      Object.assign(placeholders, { bodyKey: translationKey });
    }

    const substringsToCheck = [
      'clientChangeReservation',
      'staffChangeReservation',
    ];
    const includesChange = substringsToCheck.some((substring) =>
      translationKey.includes(substring),
    );

    reservationStatus = includesChange ? 'CHANGED' : reservationStatus;

    const { title, placeholder } = this.getReservationNotificationTitle(
      reservationStatus,
      i18n,
      placeholders,
    );

    return { title, message, placeholder };
  }

  private getReservationNotificationTitle(
    status: string,
    i18n: any,
    placeholders: any,
  ): any {
    const { statusKey, statusTranslation } = this.translateReservationStatus(
      status,
      i18n,
    );

    const title = i18n
      .t('translation.notification.reservationTitle')
      .replace('{reservationStatus}', statusTranslation);

    const placeholder = {
      ...placeholders,
      statusKey,
      titleKey: 'translation.notification.reservationTitle',
      '{reservationStatus}': statusTranslation,
    };

    return { title, placeholder };
  }

  private translateReservationStatus(status: string, i18n: any): any {
    const statusTranslations = {
      [ReservationStatus.PENDING]: 'reservationPendingStatus',
      [ReservationStatus.CONFIRMED]: 'reservationConfirmedStatus',
      [ReservationStatus.CANCELLED]: 'reservationCancelledStatus',
      [ReservationStatus.REJECTED]: 'reservationRejectedStatus',
      [ReservationStatus.DISHONORED]: 'reservationDishonoredStatus',
      [ReservationStatus.CLOSED]: 'reservationClosedStatus',
      [ReservationStatus.SERVE]: 'reservationServedStatus',
      ['CHANGED']: 'reservationChangedStatus',
    };

    const statusTranslationKey = statusTranslations[status];
    const statusKey = `translation.notification.${statusTranslationKey}`;
    const statusTranslation = statusTranslationKey ? i18n.t(statusKey) : '';

    return { statusKey, statusTranslation };
  }

  private async checkVerifiedUser(userId: string): Promise<boolean> {
    const { isVerified } = await this.userRepository
      .createQueryBuilder(this.userAlias)
      .where('user.id = :userId', { userId })
      .andWhere('user.deleted_at IS NULL')
      .getOne();

    return !!isVerified;
  }

  private async retranslateNotifications(
    userId: string,
    notifications: Notification[],
  ): Promise<Notification[]> {
    const { language } = await this.userRepository.findOne({
      where: { id: userId, deletedAt: null },
    });

    const i18n = new I18nContext(language, this.i18n);

    for (const notification of notifications) {
      if (notification.placeholder) {
        notification.body = i18n.t(notification.placeholder.bodyKey);
        notification.title = i18n.t(notification.placeholder.titleKey);

        const statusKey = notification.placeholder.statusKey
          ? i18n.t(notification.placeholder.statusKey)
          : null;

        for (const key in notification.placeholder) {
          if (notification.body.match(gre(key))) {
            notification.body = notification.body.replace(
              gre(key),
              notification.placeholder[key],
            );
          }
          if (notification.title.match(gre(key))) {
            notification.title = notification.title.replace(
              gre(key),
              statusKey ? statusKey : notification.placeholder[key],
            );
          }
        }

        delete notification.placeholder;
      }

      notification.body = this.replaceUnicodes(notification.body);
    }

    return notifications;
  }

  private replaceUnicodes(message: string): string {
    const unicodes = {
      '\\u{1F7E1}': '\u{1F7E1}',
      '\\u{1F7E2}': '\u{1F7E2}',
      '\\u{1F7E3}': '\u{1F7E3}',
    };

    for (const [key, unicode] of Object.entries(unicodes)) {
      message = message.split(key).join(unicode);
    }

    return message;
  }

  private isChefOrBartender(staffRole: StaffRole): boolean {
    return [StaffRole.CHEF, StaffRole.SOUS_CHEF, StaffRole.BARTENDER].includes(
      staffRole,
    );
  }

  private async handleNewOrderNotification(
    data: any,
    i18n: any,
    tableNames: string,
  ): Promise<void> {
    const { restaurantId, existDrinks, onlyDrinks } = data;

    const notificationData = {
      titleKey: 'translation.notification.newOrderTitle',
      bodyKey: 'translation.notification.staffNewOrderReservation',
      placeholder: { '{tableNames}': tableNames },
    };

    const staff = await this.getRelevantStaffForNewOrder(
      restaurantId,
      existDrinks,
      onlyDrinks,
    );

    await this.sendOrderNotificationToStaff(
      staff,
      i18n,
      notificationData,
      tableNames,
    );
  }

  private async getRelevantStaffForNewOrder(
    restaurantId: string,
    existDrinks: boolean,
    onlyDrinks: boolean,
  ): Promise<any[]> {
    const staff = await this.userRepository.find({
      where: {
        restaurantId,
        role: In([StaffRole.CHEF, StaffRole.SOUS_CHEF, StaffRole.BARTENDER]),
        deletedAt: null,
        isVerified: true,
      },
      select: ['id', 'role', 'language'],
    });

    return this.getStaffBasedOnOrderType(staff, existDrinks, onlyDrinks);
  }

  private async handleOrderReadyNotification(
    data: any,
    i18n: any,
    tableNames: string,
    waiterId: string,
  ): Promise<void> {
    const { restaurantId } = data;

    const allStaff = waiterId
      ? await this.userRepository.find({
          where: { id: waiterId, deletedAt: null, isVerified: true },
          select: ['id', 'language'],
        })
      : await this.userRepository.find({
          where: {
            restaurantId,
            role: In([
              StaffRole.WAITER,
              StaffRole.HOSTESS,
              StaffRole.SUPER_HOSTESS,
            ]),
            deletedAt: null,
            isVerified: true,
          },
          select: ['id', 'language'],
        });

    const notificationData = {
      titleKey: 'translation.notification.readyOrderTitle',
      bodyKey: 'translation.notification.staffReadyOrderReservation',
      placeholder: { '{tableNames}': tableNames },
    };

    await this.sendOrderNotificationToStaff(
      allStaff,
      i18n,
      notificationData,
      tableNames,
    );
  }

  private async sendOrderNotificationToStaff(
    staff: Partial<User[]>,
    i18n: any,
    notificationData: any,
    tableNames: string,
  ): Promise<void> {
    await Promise.all(
      staff.map(async (staffMember) => {
        i18n.lang = staffMember.language;
        try {
          await this.sendNotification(
            staffMember.id,
            i18n.t(notificationData.titleKey),
            i18n
              .t(notificationData.bodyKey)
              .replace('{tableNames}', tableNames),
            notificationData.placeholder,
          );
        } catch (error) {
          throw new HttpException(
            ERROR_MESSAGES.notificationSendingError,
            HttpStatus.BAD_REQUEST,
          );
        }
      }),
    );
  }

  private getStaffBasedOnOrderType(
    staff: User[],
    existDrinks: boolean,
    onlyDrinks: boolean,
  ): Partial<User[]> {
    const staffChef = staff.filter(({ role }) =>
      [StaffRole.CHEF, StaffRole.SOUS_CHEF].includes(role as any),
    );
    const staffBartender = staff.filter(
      ({ role }) => role === StaffRole.BARTENDER,
    );

    if (existDrinks && !onlyDrinks) {
      return [...staffChef, ...staffBartender];
    }

    if (existDrinks && onlyDrinks) {
      return staffBartender;
    }

    return staffChef;
  }
}
