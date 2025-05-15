import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StockCategory } from '../enums/stock_category.enum';
import { TVAType } from '../enums/tva_type.enum';
import { Unit } from '../enums/unit.enum';
import { StockStatus } from '../enums/stock_status.enum';
import { PaymentMethod } from '../enums/payment_method.enum';

@Entity()
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Index()
  @Column({ name: 'restaurant_id', nullable: false })
  public restaurantId: string;

  @Column({ name: 'title', nullable: false })
  public title: string;

  @Column('enum', {
    name: 'category',
    enum: StockCategory,
    default: StockCategory.NO_CATEGORY,
  })
  public category: StockCategory;

  @Column({ name: 'expiration_date', nullable: false })
  public expirationDate: Date;

  @Column({
    name: 'volume',
    type: 'decimal',
    precision: 7,
    scale: 2,
    nullable: false,
  })
  public volume: number;

  @Column({ name: 'pc_volume', nullable: true })
  public pcVolume: number;

  @Column('enum', { name: 'pc_unit', enum: Unit, default: Unit.GRAMS })
  public pcUnit: Unit;

  @Column('enum', { name: 'unit', enum: Unit, default: Unit.KG })
  public unit: Unit;

  @Column({ name: 'reorder_limit', nullable: false })
  public reorderLimit: number;

  @Column('enum', {
    name: 'tva_percent',
    enum: TVAType,
    nullable: true,
  })
  public tvaType: TVAType;

  @Column('enum', {
    name: 'stock_status',
    enum: StockStatus,
    default: StockStatus.SUFFICIENT,
  })
  public stockStatus: StockStatus;

  @Column({ name: 'price_wout_tva', nullable: false })
  public priceWithoutTva: number;

  @Column({ name: 'price_with_tva', nullable: true })
  public priceWithTva: number;

  @Column('enum', {
    name: 'payment_method',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  public paymentMethod: PaymentMethod;

  @Column({ name: 'invoice_number', nullable: false })
  public invoiceNumber: string;

  @Index()
  @Column({ name: 'suplier_id', nullable: false })
  public suplierId: string;

  @Column({ name: 'suplier_name', nullable: false })
  public suplierName: string;

  @BeforeInsert()
  @BeforeUpdate()
  async convertDateFields() {
    if (this.expirationDate) {
      this.expirationDate = new Date(this.expirationDate);
    }
  }
}
