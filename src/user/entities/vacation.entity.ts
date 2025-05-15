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
import { VacationType } from '../enums/vacation-type.enum';
import { User } from './user.entity';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsString,
  Max,
  MaxDate,
  Min,
  MinDate,
} from 'class-validator';
import { VacationStatus } from '../enums/vacation_status.enum';

@Entity()
export class Vacation {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'start_date', nullable: true })
  @IsDate()
  @MinDate(new Date())
  public startDate: Date;

  @Column({ name: 'end_date', nullable: true })
  @IsDate()
  @MaxDate(new Date())
  public endDate: Date;

  @Column('enum', {
    name: 'vacation_type',
    enum: VacationType,
    default: VacationType.SIMPLE_VACATION,
  })
  @IsEnum(VacationType)
  public vacationType: VacationType;

  @Column({ name: 'available_days', nullable: true })
  @IsNumber()
  @Min(0)
  public availableDays: number;

  @Column({ name: 'requested_days', nullable: true })
  @IsNumber()
  @Min(1)
  @Max(14)
  public requestedDays: number;

  @Column('enum', {
    name: 'status',
    enum: VacationStatus,
    default: VacationStatus.WAITING,
  })
  public vacationStatus: VacationStatus;

  @Column({ name: 'key', nullable: true })
  public key: string;

  @Column({ name: 'vacation_identifier', nullable: true })
  @IsString()
  public vacationIdentifier: string;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @ManyToOne(() => User, (user) => user.vacations)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @BeforeInsert()
  @BeforeUpdate()
  async convertDateFields() {
    const dateFields = ['startDate', 'endDate'];

    for (const field of dateFields) {
      if (this[field]) {
        this[field] = new Date(this[field]);
      }
    }
  }
}
