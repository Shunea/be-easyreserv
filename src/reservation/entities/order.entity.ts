import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Reservation } from './reservation.entity';
import { Product } from '@src/product/entities/product.entity';
import { OrderStatus } from '../enums/orderStatus.enum';
import { ServiceType } from '../enums/serviceType.enum';
import { CourseType } from '../enums/courseType.enum';
import { Doneness } from '../enums/doneness.enum';
import { PreparationZones } from '@src/product/enums/preparation-zones.enum';
import { HttpException, HttpStatus } from '@nestjs/common';

@Entity()
export class Order {
  @ApiProperty({
    description: 'Unique identifier of the order',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-12-25T12:00:00Z',
  })
  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-12-25T12:30:00Z',
  })
  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Deletion timestamp',
    example: null,
  })
  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @ApiProperty({
    description: 'Title of the order',
    example: 'Grilled Salmon',
  })
  @Column({ name: 'title', nullable: false })
  public title: string;

  @ApiProperty({
    description: 'Quantity ordered',
    example: 2,
  })
  @Column({ name: 'quantity', nullable: false })
  public quantity: number;

  @ApiProperty({
    description: 'Current status of the order',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  @Column('enum', {
    name: 'status',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  public status: OrderStatus;

  @ApiProperty({
    description: 'Product ID reference',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Index()
  @Column({ name: 'product_id', nullable: false, type: 'uuid' })
  public productId: string;

  @ApiProperty({
    description: 'Price of the order',
    example: 29.99,
  })
  @Column('decimal', {
    name: 'price',
    nullable: false,
    precision: 10,
    scale: 2,
    default: 0,
  })
  public price: number;

  @ApiProperty({
    description: 'Whether the order is a pre-order',
    example: false,
  })
  @Column({ name: 'is_preorder', nullable: false, default: false })
  public isPreorder: boolean;

  @ApiPropertyOptional({
    description: 'Special instructions or notes for creation',
    example: 'Extra spicy',
  })
  @Column({ name: 'creation_notice', nullable: true })
  public creationNotice: string;

  @ApiPropertyOptional({
    description: 'Notes for deletion or cancellation',
    example: 'Customer changed their mind',
  })
  @Column({ name: 'deletion_notice', nullable: true })
  public deletionNotice: string;

  @ApiProperty({
    description: 'Reservation ID reference',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Index()
  @Column({ name: 'reservation_id', nullable: false })
  public reservationId: string;

  @ApiProperty({
    description: 'Service type of the order',
    enum: ServiceType,
    example: ServiceType.ON_SITE,
  })
  @Column({
    name: 'service_type',
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.ON_SITE
  })
  public serviceType: ServiceType;

  @ApiProperty({
    description: 'Course type of the order',
    enum: CourseType,
    example: CourseType.COURSE_1,
  })
  @Column({
    name: 'course_type',
    type: 'enum',
    enum: CourseType,
    default: CourseType.COURSE_1
  })
  public courseType: CourseType;

  @ApiPropertyOptional({
    description: 'Doneness level (only for Grill, Fish, or Hot preparation zones)',
    enum: Doneness,
    example: Doneness.MEDIUM,
  })
  @Column({
    name: 'doneness',
    type: 'enum',
    enum: Doneness,
    nullable: true
  })
  public doneness: Doneness;

  @ApiProperty({
    description: 'Related reservation',
    type: () => Reservation,
  })
  @ManyToOne(() => Reservation, (reservation) => reservation.orders)
  @JoinColumn({ name: 'reservation_id' })
  public reservation: Reservation;

  @ApiProperty({
    description: 'Related product',
    type: () => Product,
  })
  @ManyToOne(() => Product, (product) => product.orders)
  @JoinColumn({ name: 'product_id' })
  public product: Product;

  @ApiProperty({
    description: "Ready at",
    example: "2023-12-25T12:00:00Z",
  })
  @Column({ name: 'ready_at', nullable: true })
  public readyAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async validateDoneness() {
    if (this.doneness && this.product) {
      const allowedZones = [
        PreparationZones.Grill,
        PreparationZones.Fish,
        PreparationZones.Hot
      ];
      
      if (!allowedZones.includes(this.product.preparationZone)) {
        throw new HttpException(
          'Doneness level can only be set for items from Grill, Fish, or Hot preparation zones',
          HttpStatus.BAD_REQUEST
        );
      }
    }
  }
}
