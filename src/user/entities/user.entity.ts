import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
  OneToOne,
  Index,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { hash } from 'bcrypt';
import { Role } from '../enums/roles.enum';
import { StaffRole } from '../enums/staff.roles.enum';
import { Schedule } from './schedule.entity';
import { Reservation } from '@src/reservation/entities/reservation.entity';
import { Purpose } from './purpose.entity';
import { Vacation } from './vacation.entity';
import { Document } from '@src/document/entities/document.entity';
import { TokenKey } from '@src/tokenKey/entities/tokenKey.entity';
import { Review } from '@src/review/entities/review.entity';
import { RefreshToken } from '@src/refreshToken/entities/refreshToken.entity';
import { QRCode } from '@src/qrCode/entities/qrCode.entity';
import { PlanHistory } from '@src/plan/entities/planHistory.entity';
import { Favorite } from '@src/favorite/entities/favorite.entity';
import { NotificationToken } from '@src/notification/entities/notification-token.entity';
import { Gender } from '../enums/gender.enum';
import { Language } from '../enums/language.enum';
import { Transport } from '@src/transport/entities/transport.entity';
import { Bonus } from '@src/bonus/entities/bonus.entity';
import { SalaryType } from '@src/user/enums/staff.salary-type.enum';
import { Currency } from '@src/user/enums/currency.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'avatar', nullable: true })
  public avatar: string;

  @Column({ name: 'username', nullable: false })
  public username: string;

  @Column({ name: 'email', nullable: false, unique: true })
  public email: string;

  @Column({ name: 'date_of_birth', nullable: true })
  public dateOfBirth: string;

  @Column('enum', {
    name: 'gender',
    enum: Gender,
    default: Gender.Other,
  })
  public gender: Gender;

  @Column({ name: 'phone_number', nullable: false })
  public phoneNumber: string;

  @Column({ name: 'password', nullable: false, select: false })
  public password: string;

  @Column({ name: 'created_by', nullable: true })
  public createdBy: string;

  @Index()
  @Column({ name: 'restaurant_id', nullable: true })
  public restaurantId: string;

  @Index()
  @Column({ name: 'place_id', nullable: true })
  public placeId: string;

  @Column({ name: 'is_verified', default: false })
  public isVerified: boolean;

  @Column('enum', {
    name: 'role',
    enum: [...Object.values(Role), ...Object.values(StaffRole)],
    default: Role.USER,
  })
  public role: Role | StaffRole;

  @Column({ name: 'role_name', nullable: true })
  public roleName: string;

  @Column('enum', {
    name: 'salary_type',
    enum: SalaryType,
    default: SalaryType.MONTHLY,
  })
  public salaryType: SalaryType;

  @Column('enum', {
    name: 'currency',
    enum: Currency,
    default: Currency.MDL,
  })
  public currency: Currency;

  @Column({ name: 'salary', nullable: true })
  public salary: number;

  @Column({ name: 'is_vip', default: false })
  public isVip: boolean;

  @Column('enum', {
    name: 'language',
    enum: Language,
    default: Language.English,
  })
  public language: Language;

  @Column({ name: 'is_google_auth', default: false })
  public isGoogleAuth: boolean;

  @Column({ name: 'is_apple_auth', default: false })
  public isAppleAuth: boolean;

  @Column({ name: 'department' })
  public department: string;

  @OneToMany(() => Schedule, (schedule) => schedule.user, {
    eager: true,
    cascade: true,
  })
  public staffSchedules: Schedule[];

  @OneToMany(() => Reservation, (reservation) => reservation.user, {
    cascade: true,
  })
  public reservations: Reservation[];

  @OneToMany(() => Purpose, (purpose) => purpose.user, { cascade: true })
  public purposes: Purpose[];

  @OneToMany(() => Vacation, (vacation) => vacation.user, { cascade: true })
  public vacations: Vacation[];

  @OneToMany(() => Document, (document) => document.user, { cascade: true })
  public documents: Document[];

  @OneToMany(() => TokenKey, (tokenKey) => tokenKey.user)
  public tokenKeys: TokenKey[];

  @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user)
  public refreshToken: RefreshToken;

  @OneToMany(() => Review, (review) => review.user)
  public reviews: Review[];

  @OneToMany(() => Favorite, (favorite) => favorite.user, { cascade: true })
  public favorites: Favorite[];

  @OneToMany(() => PlanHistory, (planHistory) => planHistory.user, {
    cascade: true,
  })
  public planHistories: PlanHistory[];

  @OneToMany(() => QRCode, (qrcode) => qrcode.user, { cascade: true })
  public qrCode: QRCode[];

  @OneToMany(
    () => NotificationToken,
    (notificationToken) => notificationToken.user,
    { cascade: true },
  )
  public notificationTokens: NotificationToken[];

  @OneToMany(() => Bonus, (bonus) => bonus.user, {
    cascade: true,
  })
  public bonuses: Bonus[];

  @ManyToMany(() => Transport)
  @JoinTable({
    name: 'transport_user',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'transport_id',
      referencedColumnName: 'id',
    },
  })
  public transport: Transport[];

  @Column({ name: 'current_schedule_id', nullable: true })
  public currentScheduleId: string;

  @OneToOne(() => Schedule)
  @JoinColumn({ name: 'current_schedule_id' })
  public currentSchedule: Schedule;

  @Column({ name: 'waiter_code', nullable: true, length: 6, unique: true })
  public waiterCode: string | null;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await hash(this.password, 10);
    }
  }
}
