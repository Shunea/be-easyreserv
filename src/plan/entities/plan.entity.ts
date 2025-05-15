import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { BillingPeriod } from '../enum/billingPeriod.enum';
import { PlaceType } from '@src/place/enums/place.type.enum';
import { PlanHistory } from './planHistory.entity';
import { PlanType } from '../enum/planType.enum';

@Entity()
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'name', nullable: false })
  public name: string;

  @Column('decimal', {
    name: 'price',
    nullable: false,
    precision: 10,
    scale: 2,
    default: 0,
  })
  public price: number;

  @Column({
    name: 'type',
    type: 'enum',
    enum: PlanType,
    default: PlanType.BASIC,
  })
  public type: PlanType;

  @Column({
    name: 'billing_period',
    type: 'enum',
    enum: BillingPeriod,
    default: BillingPeriod.MONTHLY,
  })
  public billingPeriod: BillingPeriod;

  @Column({
    name: 'place_type',
    type: 'enum',
    enum: PlaceType,
    default: PlaceType.RESTAURANT,
  })
  public placeType: PlaceType;

  @OneToMany(() => PlanHistory, (planHistory) => planHistory.plan, {
    cascade: true,
  })
  public planHistories: PlanHistory[];
}
