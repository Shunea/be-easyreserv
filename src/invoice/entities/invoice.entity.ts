import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlaceType } from '@src/place/enums/place.type.enum';
import { PlanType } from '@src/plan/enum/planType.enum';
import { PaymentStatus } from '@src/invoice/enums/payment-status.enum';
import { Place } from '@src/place/entities/place.entity';

@Entity()
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'issue_date', nullable: true })
  public issueDate: Date;

  @Column({ name: 'business_name', nullable: false })
  public businessName: string;

  @Column('enum', {
    name: 'business_type',
    enum: PlaceType,
    nullable: false,
  })
  public businessType: PlaceType;

  @Column({
    name: 'subscription_type',
    type: 'enum',
    enum: PlanType,
    default: PlanType.BASIC,
  })
  public subscriptionType: PlanType;

  @Column('decimal', {
    name: 'subscription_sum',
    nullable: false,
    precision: 10,
    scale: 2,
    default: 0,
  })
  public subscriptionSum: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  billingPeriod: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  payment_status: PaymentStatus;

  @ManyToOne(() => Place, (place) => place.id, {})
  @JoinColumn({ name: 'business_id' })
  public business: Place;

  @BeforeInsert()
  @BeforeUpdate()
  async convertDateFields() {
    const dateFields = ['issueDate'];

    for (const field of dateFields) {
      if (this[field]) {
        this[field] = new Date(this[field]);
      }
    }
  }
}
