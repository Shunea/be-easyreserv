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
import { PurposeStatus } from '../enums/purpose-status.enum';
import { User } from './user.entity';
import { Schedule } from './schedule.entity';

@Entity()
export class Purpose {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ type: 'time', name: 'start_time', nullable: true })
  public startTime: string;

  @Column({ type: 'time', name: 'end_time', nullable: true })
  public endTime: string;

  @Column('enum', {
    name: 'status',
    enum: PurposeStatus,
    default: PurposeStatus.WAITING,
  })
  public status: PurposeStatus;

  @Column({ name: 'date', nullable: false })
  public date: Date;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @ManyToOne(() => User, (user) => user.purposes)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @Index()
  @Column({ name: 'schedule_id', nullable: false })
  public scheduleId: string;

  @ManyToOne(() => Schedule, (schedule) => schedule.purposes)
  @JoinColumn({ name: 'schedule_id' })
  public schedule: Schedule;

  @BeforeInsert()
  @BeforeUpdate()
  async convertDateFields() {
    if (this.date) {
      this.date = new Date(this.date);
    }
  }
}
