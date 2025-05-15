import { User } from '@src/user/entities/user.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QRCodeStatus } from '../enum/qrCode_status.enum';

@Entity()
export class QRCode {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Index()
  @Column({ name: 'restaurant_id', nullable: true })
  public restaurantId: string;

  @Column('enum', {
    name: 'status',
    enum: QRCodeStatus,
    nullable: true,
  })
  public status: QRCodeStatus;

  @Column({ name: 'date', nullable: false })
  public date: Date;

  @Index()
  @Column({ name: 'schedule_id', nullable: true })
  public scheduleId: string;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @ManyToOne(() => User, (user) => user.qrCode)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @Column({ name: 'phone_number', nullable: true })
  public phoneNumber: string;

  @Column({ name: 'longitude', nullable: true })
  public longitude: string;

  @Column({ name: 'latitude', nullable: true })
  public latitude: string;

  @BeforeInsert()
  @BeforeUpdate()
  async convertDateFields() {
    if (this.date) {
      this.date = new Date(this.date);
    }
  }
}
