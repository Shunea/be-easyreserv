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
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { StaffStatus } from '../enums/staff.status.enum';
import { User } from './user.entity';
import { Colors } from '../enums/schedule.color.enum';
import { Purpose } from './purpose.entity';

@Entity()
export class Schedule {
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

  @Column({ name: 'date', nullable: false })
  public date: Date;

  @Column({ type: 'time', name: 'start_time', nullable: true })
  public startTime: string;

  @Column({ type: 'time', name: 'end_time', nullable: true })
  public endTime: string;

  @Column({ type: 'datetime', name: 'checkin_time', nullable: true })
  public checkinTime: Date;

  @Column({ type: 'datetime', name: 'checkout_time', nullable: true })
  public checkoutTime: Date;

  @Column({
    name: 'work_hours',
    nullable: true,
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  public workHours: number;

  @Column({
    name: 'worked_hours',
    nullable: true,
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  public workedHours: number;

  @Column({
    name: 'over_work_hours',
    nullable: true,
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  public overWorkHours: number;

  @Column({ name: 'floor', nullable: true })
  public floor: string;

  @Column('enum', {
    name: 'status',
    enum: StaffStatus,
    default: StaffStatus.WORKING,
  })
  public status: StaffStatus;

  @Column('enum', {
    name: 'color',
    enum: Colors,
    default: Colors.GREEN,
  })
  public color: Colors;

  @Column({ name: 'check_status', nullable: false, default: 0 })
  public checkStatus: number;

  @Column({ name: 'deletion_notice', nullable: true })
  public deletionNotice: string;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  //@Column({ name: 'place_id', nullable: true })
  // public place_id: string;

  @ManyToOne(() => User, (user) => user.staffSchedules)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @OneToMany(() => Purpose, (purpose) => purpose.schedule, { cascade: true })
  public purposes: Purpose[];

  @BeforeInsert()
  setDefaultStatusAndConvertDateFields() {
    if (!this.status) {
      this.status = StaffStatus.WAITING_INVITE;
    }

    this.convertDateFields();
  }

  @BeforeUpdate()
  convertDateFieldsOnUpdate() {
    this.convertDateFields();
  }

  private convertDateFields() {
    if (this.date) {
      this.date = new Date(this.date);
    }
  }

  public isCurrentlyWorking(): boolean {
    return this.checkinTime != null && this.checkoutTime == null;
  }

  public canCheckin(): boolean {
    return !this.isCurrentlyWorking() && this.checkoutTime == null;
  }

  public canCheckout(): boolean {
    return this.isCurrentlyWorking();
  }
}
