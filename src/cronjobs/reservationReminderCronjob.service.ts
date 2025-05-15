import * as moment from 'moment';
import { Cron } from '@nestjs/schedule';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationService } from '@src/notification/services/notification.service';
import { Repository } from 'typeorm';
import { Reservation } from '@src/reservation/entities/reservation.entity';
import { StaffRole } from '@src/user/enums/staff.roles.enum';
import { User } from '@src/user/entities/user.entity';

@Injectable()
export class ReservationReminderCronjobService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly i18n: I18nService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('*/15 * * * *')
  async reservationNotification() {
    try {
      const reservations = await this.getReservations();

      if (reservations && reservations.length === 0) {
        return;
      }

      const transformedReservations = this.transformReservations(reservations);
      const staff = await this.getStaff(transformedReservations);

      transformedReservations.forEach((reservation) => {
        const staffIds = staff
          .filter(
            ({ restaurantId }) => reservation.restaurantId === restaurantId,
          )
          .map(({ id }) => id);
        if (staffIds.length > 0) {
          reservation.staffIds = staffIds;
        }
      });

      const notifications = await this.prepareNotifications(
        transformedReservations,
        staff,
      );

      try {
        await Promise.all(
          notifications.map(async (notification) => {
            await this.notificationService.sendNotification(
              notification.userId,
              notification.title,
              notification.message,
              notification.placeholder,
            );
          }),
        );
      } catch (error) {
        throw new HttpException(
          ERROR_MESSAGES.notificationSendingError,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  private async getReservations(): Promise<any[]> {
    const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
    const futureTime = moment()
      .add(15, 'minutes')
      .format('YYYY-MM-DD HH:mm:ss');

    const reservationsQuery = `
      SELECT
        reservation.id AS id,
        reservation.restaurant_id AS restaurantId,
        GROUP_CONCAT(
          CASE reservation.status
            WHEN 'CONFIRMED' THEN CONCAT('CONFIRMED', \`table\`.table_name)
            WHEN 'SERVE' THEN CONCAT('SERVE', \`table\`.table_name)
            WHEN 'PENDING' THEN CONCAT('PENDING', \`table\`.table_name)
            WHEN 'CONFIRMED_PREORDER' THEN CONCAT('CONFIRMED', \`table\`.table_name)
            WHEN 'SERVE_PREORDER' THEN CONCAT('SERVE', \`table\`.table_name)
            WHEN 'PENDING_PREORDER' THEN CONCAT('PENDING', \`table\`.table_name)
            ELSE \`table\`.table_name
          END
          ORDER BY \`table\`.table_name
        ) AS tableNames,
        reservation.status IN ('CONFIRMED', 'CONFIRMED_PREORDER') AS isConfirmed,
        reservation.status IN ('SERVE', 'SERVE_PREORDER', 'CONFIRMED', 'CONFIRMED_PREORDER', 'PENDING', 'PENDING_PREORDER') AS isPast
      FROM
        reservation
        LEFT JOIN reservation_table ON reservation.id = reservation_table.reservation_id
        LEFT JOIN \`table\` ON reservation_table.table_id = \`table\`.id
        AND table.deleted_at IS NULL
      WHERE
        ((
          reservation.start_time BETWEEN ? AND ?
          AND reservation.status IN ('CONFIRMED', 'CONFIRMED_PREORDER')
        )
        OR (
          reservation.end_time <= ?
          AND reservation.status IN ('SERVE', 'SERVE_PREORDER')
        )
        OR (
          reservation.start_time <= ?
          AND reservation.status IN ('CONFIRMED', 'CONFIRMED_PREORDER', 'PENDING', 'PENDING_PREORDER')
        )) AND reservation.deleted_at IS NULL
      GROUP BY
        reservation.id,
        reservation.restaurant_id;
    `;

    return await this.reservationRepository.query(reservationsQuery, [
      currentTime,
      futureTime,
      currentTime,
      currentTime,
    ]);
  }

  private transformReservations(reservations: any[]): any {
    const groupedReservations = {};

    for (const reservation of reservations) {
      const { restaurantId, tableNames, isConfirmed, isPast } = reservation;
      const key = `${restaurantId}_${isConfirmed}${isPast}`;
      if (!groupedReservations[key]) {
        groupedReservations[key] = {
          restaurantId,
          tableNames: tableNames.split(',').sort().join(','),
          isConfirmed,
          isPast,
          staffIds: [],
        };
      } else {
        groupedReservations[key].tableNames = [
          ...groupedReservations[key].tableNames.split(','),
          ...reservation.tableNames.split(','),
        ]
          .sort()
          .join(',');
      }
    }

    return Object.values(groupedReservations);
  }

  private async getStaff(transformedReservations: any): Promise<any[]> {
    const restaurantIds = [
      ...new Set(
        transformedReservations.map(
          (reservation) => `'${reservation.restaurantId}'`,
        ),
      ),
    ].join(',');
    const staffRoles = [
      StaffRole.WAITER,
      StaffRole.HOSTESS,
      StaffRole.SUPER_HOSTESS,
    ]
      .map((role) => `'${role}'`)
      .join(',');

    const staffQuery = `
      SELECT id, language, restaurant_id as restaurantId
      FROM user
      WHERE user.restaurant_id IN (${restaurantIds})
      AND user.role IN (${staffRoles})
      AND user.deleted_at IS NULL;
    `;

    return await this.userRepository.query(staffQuery);
  }

  private async prepareNotifications(
    transformedReservations: any[],
    staff: any[],
  ) {
    const notifications = [];

    for (const reservation of transformedReservations) {
      for (const staffId of reservation.staffIds) {
        const language = staff.find(({ id }) => id === staffId)?.language;
        const i18n = new I18nContext(language || 'en', this.i18n);
        const title = i18n.t('translation.notification.updateStatusTitle');
        const tableNames = this.replaceUnicodes(reservation.tableNames);
        const messageKey =
          reservation.isConfirmed === '1'
            ? 'staffComingConfirmedReservation'
            : 'staffRequireActionReservation';
        const message = i18n
          .t(`translation.notification.${messageKey}`)
          .replace('{tableNames}', tableNames);
        const placeholder = {
          titleKey: 'translation.notification.updateStatusTitle',
          bodyKey: `translation.notification.${messageKey}`,
          '{tableNames}': tableNames,
        };
        notifications.push({ userId: staffId, title, message, placeholder });
      }
    }

    return notifications;
  }

  private replaceUnicodes(message: string): string {
    const statusToUnicode = {
      CONFIRMED: '\\u{1F7E2}',
      SERVE: '\\u{1F7E3}',
      PENDING: '\\u{1F7E1}',
    };

    for (const [key, unicode] of Object.entries(statusToUnicode)) {
      message = message.split(key).join(unicode);
    }

    return message;
  }
}
