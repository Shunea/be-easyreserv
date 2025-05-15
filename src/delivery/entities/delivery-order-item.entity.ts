import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Column } from 'typeorm';
import { DeliveryOrder } from './delivery-order.entity';
import { Product } from '@src/product/entities/product.entity';

@Entity('delivery_order_items')
export class DeliveryOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36 })
  order_id: string;

  @Column({ type: 'varchar', length: 36 })
  product_id: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => DeliveryOrder)
  @JoinColumn({ name: 'order_id' })
  order: DeliveryOrder;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
