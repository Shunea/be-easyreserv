import { User } from '@src/user/entities/user.entity';

import { PaymentType } from '@src/payment/entities/payment-account.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import {
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Column } from 'typeorm';
import { DeliveryOrderItem } from './delivery-order-item.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { OperatorStatus } from '../enums/operator-status.enum';
import { ApiProperty } from '@nestjs/swagger';

@Entity('delivery_orders')
export class DeliveryOrder {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  restaurant_id: string;

  @Column({ type: 'varchar', length: 36 })
  operator_id: string;

  @Column({ type: 'varchar', length: 255 })
  client_name: string;

  @Column({ type: 'varchar', length: 20 })
  client_phone: string;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'varchar', length: 255 })
  address_entrance: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  address_staircase: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  address_floor: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  address_intercom: string;

  @Column({ type: 'enum', enum: PaymentType })
  payment_type: PaymentType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  courier_id: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  courier_phone: string;

  @Column({ type: 'enum', enum: DeliveryStatus })
  courier_status: DeliveryStatus;

  @Column({ type: 'datetime', nullable: true })
  courier_pickup_time: Date;

  @ApiProperty({ type: 'number', format: 'decimal' })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  courier_latitude: number;

  @ApiProperty({ type: 'number', format: 'decimal' })
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  courier_longitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  client_latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  client_longitude: number;

  @Column({ type: 'int', nullable: true })
  estimated_delivery_time: number;

  @Column({ type: 'int', nullable: true })
  estimated_preparation_time: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'datetime', nullable: true })
  deleted_at: Date;

  @Column({ type: 'datetime', nullable: true })
  operator_modified_at: Date;

  @Column({ type: 'datetime' })
  order_date: Date;

  // Relations
  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'operator_id' })
  operator: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'courier_id' })
  courier: User;

  @OneToMany(() => DeliveryOrderItem, (item) => item.order)
  items: DeliveryOrderItem[];
}
