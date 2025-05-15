import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
  DeleteDateColumn,
  BeforeInsert,
  JoinTable,
  ManyToMany,
  BeforeUpdate,
} from 'typeorm';
import { Order } from './order.entity';
import { ReservationStatus } from '../enums/reservationStatus.enum';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Review } from '@src/review/entities/review.entity';
import { Table } from '@src/table/entities/table.entity';
import { User } from '@src/user/entities/user.entity';
import { ReservationBonusType } from '../enums/reservationBonus.enum';

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'date', nullable: false })
  public date: Date;

  @Column({ name: 'start_time', nullable: false })
  public startTime: Date;

  @Column({ name: 'end_time', nullable: false })
  public endTime: Date;

  @Column('enum', {
    name: 'status',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  public status: ReservationStatus;

  @Column({ name: 'guests_number', nullable: false })
  public guestsNumber: number;

  @Index()
  @Column({ name: 'table_id', nullable: false })
  public tableId: string;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @Index()
  @Column({ name: 'waiter_id', nullable: true })
  public waiterId: string;

  @Index()
  @Column({ name: 'restaurant_id', nullable: true })
  public restaurantId: string;

  @Column({ name: 'number', nullable: false, default: 0 })
  public number: number;

  @Column({ name: 'reason', nullable: true })
  public reason: string;

  @Column('enum', {
    name: 'bonus_type',
    enum: ReservationBonusType,
    default: ReservationBonusType.NO_BONUS,
  })
  public bonusType: ReservationBonusType;

  @ManyToMany(() => Table)
  @JoinTable({
    name: 'reservation_table',
    joinColumn: {
      name: 'reservation_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'table_id',
      referencedColumnName: 'id',
    },
  })
  public tables: Table[];

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.reservations)
  @JoinColumn({ name: 'restaurant_id' })
  public restaurant: Restaurant;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: 'waiter_id' })
  public waiter: User;

  @OneToMany(() => Order, (order) => order.reservation, {
    eager: true,
    cascade: true,
  })
  public orders: Order[];

  @OneToMany(() => Review, (review) => review.reservation, { cascade: true })
  public reviews: Review[];

  @BeforeInsert()
  @BeforeUpdate()
  async convertDateFields() {
    const dateFields = ['date', 'startTime', 'endTime'];

    for (const field of dateFields) {
      if (this[field]) {
        this[field] = new Date(this[field]);
      }
    }
  }
}
