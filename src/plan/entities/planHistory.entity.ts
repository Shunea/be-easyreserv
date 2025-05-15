import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  ManyToOne,
  DeleteDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Plan } from './plan.entity';
import { User } from '@src/user/entities/user.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';

@Entity()
export class PlanHistory {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'billing_date', nullable: true })
  public billingDate: Date;

  @Column({ name: 'next_billing_date', nullable: true })
  public nextBillingDate: Date;

  @Column({ name: 'is_active', default: false })
  public isActive: boolean;

  @Column({ name: 'is_paid', default: false })
  public isPaid: boolean;

  @Column({ name: 'is_trial_period', default: true })
  public isTrialPeriod: boolean;

  @Column({ name: 'start_trial_period', nullable: true })
  public startTrialPeriod: Date;

  @Column({ name: 'end_trial_period', nullable: true })
  public endTrialPeriod: Date;

  @Index()
  @Column({ name: 'plan_id', default: true })
  public planId: string;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @Index()
  @Column({ name: 'restaurant_id', nullable: true })
  public restaurantId: string;

  @ManyToOne(() => User, (user) => user.planHistories)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @ManyToOne(() => Plan, (plan) => plan.planHistories)
  @JoinColumn({ name: 'plan_id' })
  public plan: Plan;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.planHistories)
  @JoinColumn({ name: 'restaurant_id' })
  public restaurant: Restaurant;

  @BeforeInsert()
  @BeforeUpdate()
  async convertDateFields() {
    const dateFields = [
      'billingDate',
      'nextBillingDate',
      'startTrialPeriod',
      'endTrialPeriod',
    ];

    for (const field of dateFields) {
      if (this[field]) {
        this[field] = new Date(this[field]);
      }
    }
  }
}
