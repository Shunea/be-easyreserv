import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { User } from '@src/user/entities/user.entity';

export enum PaymentType {
  CASH = 'CASH',
  POS = 'POS',
  TRANSFER = 'TRANSFER',
}

export enum PaymentStatus {
  PROCESSED = 'PROCESSED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
}

@Entity('payment_accounts')
export class PaymentAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  receipt_number: string;

  @Column({ type: 'varchar', length: 36 })
  order_id: string;

  @Column({ type: 'varchar', length: 36 })
  restaurant_id: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  payment_date: Date;

  @Column({ type: 'enum', enum: PaymentType })
  payment_type: PaymentType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_value: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  payment_status: PaymentStatus;

  @Column({ type: 'varchar', length: 36 })
  operator_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;
}
