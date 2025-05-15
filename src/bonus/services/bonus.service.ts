import { Bonus } from '../entities/bonus.entity';
import { BonusType } from '../enums/bonus.enum';
import { ERROR_MESSAGES } from '@src/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '@src/reservation/entities/reservation.entity';
import { ReservationBonusType } from '@src/reservation/enums/reservationBonus.enum';
import { ReservationStatus } from '@src/reservation/enums/reservationStatus.enum';
import { UpdateBonusDto } from '../dto/updateBonus.dto';
import { User } from '@src/user/entities/user.entity';

@Injectable()
export class BonusService {
  private alias = 'bonus';

  constructor(
    @InjectRepository(Bonus)
    private readonly bonusRepository: Repository<Bonus>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) {}

  async createUserBonus(userId: string, reservation: Reservation) {
    try {
      const isVip = await this.isVipUser(userId, reservation.restaurantId);
      const reservationsCount = await this.getUserReservationCount(
        reservation.restaurantId,
        userId,
      );

      if (isVip) {
        await this.vipUserBonusLogic(reservationsCount, reservation);
      } else {
        await this.isSimpleUser(userId, reservation.restaurantId);
        await this.simpleUserBonusLogic(reservationsCount, reservation);
      }
    } catch (err) {
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }
  }

  async update(body: UpdateBonusDto) {
    const { userId, restaurantId, type } = body;
    const bonus = await this.bonusRepository
      .createQueryBuilder(this.alias)
      .where('bonus.user_id = :userId', { userId })
      .andWhere('bonus.restaurant_id = :restaurantId', {
        restaurantId,
      })
      .andWhere('bonus.deleted_at IS NULL')
      .getOne();

    if (!bonus) {
      throw new HttpException(
        ERROR_MESSAGES.noBonusesAvailable,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.bonusRepository.update(bonus.id, { type });

    return await this.bonusRepository.findOne({ where: { id: bonus.id } });
  }

  async isVipUser(userId: string, restaurantId: string): Promise<boolean> {
    const checkForGlobalVip = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .andWhere('user.is_vip = true')
      .andWhere('user.deleted_at IS NULL')
      .getOne();

    const checkForRestaurantVip = await this.bonusRepository
      .createQueryBuilder(this.alias)
      .where('bonus.user_id = :userId', { userId })
      .andWhere('bonus.restaurant_id = :restaurantId', {
        restaurantId,
      })
      .andWhere('bonus.type = :type', {
        type: BonusType.VIP,
      })
      .andWhere('bonus.deleted_at IS NULL')
      .getOne();

    return !!checkForGlobalVip || !!checkForRestaurantVip;
  }

  async isSimpleUser(userId: string, restaurantId: string) {
    const bonus = await this.bonusRepository.findOne({
      where: { userId: userId, restaurantId: restaurantId, deletedAt: null },
    });

    if (bonus) {
      return;
    } else {
      const newUserStatus = new Bonus();
      newUserStatus.userId = userId;
      newUserStatus.restaurantId = restaurantId;
      newUserStatus.type = BonusType.SIMPLE;
      await this.bonusRepository.save(newUserStatus);
    }
  }

  async getUserReservationCount(restaurantId: string, userId: string) {
    const reservationsCount = await this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.status = :status', {
        status: ReservationStatus.CLOSED,
      })
      .andWhere('reservation.restaurant_id = :restaurantId', {
        restaurantId,
      })
      .andWhere('reservation.user_id = :userId', { userId })
      .andWhere('reservation.deleted_at IS NULL')
      .getCount();

    return reservationsCount;
  }

  async simpleUserBonusLogic(
    reservationsCount: number,
    reservation: Reservation,
  ) {
    if (reservationsCount > 0) {
      if ((reservationsCount + 1) % 6 === 0) {
        reservation.bonusType = ReservationBonusType.COMMON;
      } else if ((reservationsCount + 1) % 3 === 0) {
        reservation.bonusType = ReservationBonusType.SINGLE;
      } else {
        reservation.bonusType = ReservationBonusType.NO_BONUS;
      }
    } else {
      reservation.bonusType = ReservationBonusType.NO_BONUS;
    }
  }

  async vipUserBonusLogic(reservationsCount: number, reservation: Reservation) {
    if ((reservationsCount + 1) % 5 === 0) {
      reservation.bonusType = ReservationBonusType.COMMON;
    } else {
      reservation.bonusType = ReservationBonusType.SINGLE;
    }
  }
}
