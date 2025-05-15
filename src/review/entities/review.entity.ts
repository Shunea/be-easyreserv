import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  Index,
  OneToOne,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '@src/user/entities/user.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Reservation } from '@src/reservation/entities/reservation.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ type: 'text', name: 'message', nullable: true })
  public message: string;

  @Column({ name: 'food_rating', nullable: true })
  public foodRating: number;

  @Column({ name: 'service_rating', nullable: true })
  public serviceRating: number;

  @Column({ name: 'price_rating', nullable: true })
  public priceRating: number;

  @Column({ name: 'ambience_rating', nullable: true })
  public ambienceRating: number;

  @Column({ name: 'behavior_rating', nullable: true })
  public behaviorRating: number;

  @Column({ name: 'communication_rating', nullable: true })
  public communicationRating: number;

  @Column({ name: 'punctuality_rating', nullable: true })
  public punctualityRating: number;

  @Column({ name: 'generosity_rating', nullable: true })
  public generosityRating: number;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @Index()
  @Column({ name: 'restaurant_id', nullable: true })
  public restaurantId: string;

  @Index()
  @Column({ name: 'reservation_id', nullable: true })
  public reservationId: string;

  @Column({ name: 'is_staff_review', default: false })
  public isStaffReview: boolean;

  @Column({ name: 'is_client_review', default: false })
  public isClientReview: boolean;

  @ManyToOne(() => User, (user) => user.reviews)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.reviews)
  @JoinColumn({ name: 'restaurant_id' })
  public restaurant: Restaurant;

  @ManyToOne(() => Reservation, (reservation) => reservation.reviews)
  @JoinColumn({ name: 'reservation_id' })
  public reservation: Reservation;
}
