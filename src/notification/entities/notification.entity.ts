import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { NotificationToken } from './notification-token.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'title', nullable: true })
  public title: string;

  @Column({ type: 'text', name: 'body', nullable: true })
  public body: string;

  @Column({ type: 'json', name: 'placeholder', nullable: true })
  public placeholder: any;

  @Index()
  @Column({ name: 'notification_token_id', nullable: false })
  public notificationTokenId: string;

  @ManyToOne(
    () => NotificationToken,
    (notificationToken) => notificationToken.notifications,
  )
  @JoinColumn({ name: 'notification_token_id' })
  public notificationToken: NotificationToken;
}
