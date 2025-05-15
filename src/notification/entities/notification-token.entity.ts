import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationStatus } from '../enum/notification-status.enum';
import { User } from '@src/user/entities/user.entity';
import { DeviceType } from '../enum/device-type.enum';

@Entity()
export class NotificationToken {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column('enum', {
    name: 'device_type',
    enum: DeviceType,
    nullable: false,
    default: DeviceType.Web,
  })
  public deviceType: DeviceType;

  @Column({ name: 'device_token', nullable: false })
  public deviceToken: string;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @Column('enum', {
    name: 'status',
    enum: NotificationStatus,
    nullable: false,
    default: NotificationStatus.ACTIVE,
  })
  public status: NotificationStatus;

  @ManyToOne(() => User, (user) => user.notificationTokens)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @OneToMany(
    () => Notification,
    (notification) => notification.notificationToken,
    { cascade: true },
  )
  public notifications: Notification[];
}
