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

@Entity()
export class Suplier {
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

  @Column({ name: 'phone_number', nullable: false })
  public phoneNumber: string;

  @Column({ name: 'email', nullable: false })
  public email: string;

  @Column({ name: 'idno', nullable: false, length: 13 })
  public idno: string;

  @Column({ name: 'vat_number', nullable: true })
  public vatNumber: string;

  @Column({ name: 'iban', nullable: false })
  public iban: string;

  @Column({ name: 'bank_name', nullable: false })
  public bankName: string;

  @Column({ name: 'image', nullable: true })
  public image: string;

  @Column({ name: 'last_order', nullable: true })
  public lastOrder: Date;

  @Column({ name: 'order_volume', nullable: true })
  public orderVolume: number;

  @Index()
  @Column({ name: 'restaurant_id', nullable: false })
  public restaurantId: string;

  @Column({ name: 'telegram_username', nullable: true })
  public telegramUsername: string;

  @Index()
  @Column({ name: 'telegram_id', nullable: true })
  public telegramId: string;

  @BeforeInsert()
  @BeforeUpdate()
  async convertDateFields() {
    if (this.lastOrder) {
      this.lastOrder = new Date(this.lastOrder);
    }
  }
}
