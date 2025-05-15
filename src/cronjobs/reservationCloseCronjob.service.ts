import * as moment from 'moment';
import { Cron } from '@nestjs/schedule';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '@src/reservation/entities/reservation.entity';

@Injectable()
export class ReservationCloseCronjobService {
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  @Cron('30 5 * * *')
  async closeReservations() {
    try {
      const reservations = await this.getReservations();

      if (reservations && reservations.length === 0) {
        return;
      }

      try {
        await Promise.all(
          reservations.map((reservation) => {
            this.reservationRepository.update(reservation.id, {
              status: reservation.status,
            });
          }),
        );
      } catch (error) {
        throw new HttpException(
          ERROR_MESSAGES.cannotUpdateReservation,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  private async getReservations(): Promise<any[]> {
    const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');

    const reservationsQuery = `
      SELECT
        reservation.id AS id,
        CASE
          WHEN reservation.status IN (
            'CONFIRMED',
            'CONFIRMED_PREORDER',
            'PENDING',
            'PENDING_PREORDER'
          ) THEN 'CANCELLED'
          WHEN reservation.status IN ('SERVE', 'SERVE_PREORDER') THEN 'CLOSED'
          ELSE reservation.status
        END AS status
      FROM
        reservation
      WHERE
        reservation.deleted_at IS NULL
        AND reservation.end_time <= ?
        AND reservation.status IN (
          'SERVE',
          'SERVE_PREORDER',
          'CONFIRMED',
          'CONFIRMED_PREORDER',
          'PENDING',
          'PENDING_PREORDER'
        )
      GROUP BY
        reservation.id;
    `;

    return await this.reservationRepository.query(reservationsQuery, [
      currentTime,
    ]);
  }
}
