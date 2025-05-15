import { User } from '@src/user/entities/user.entity';
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
} from 'typeorm';
import { BonusType } from '../enums/bonus.enum';

@Entity()
export class Bonus {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column('enum', {
    name: 'type',
    enum: BonusType,
    default: BonusType.SIMPLE,
  })
  public type: BonusType;

  @Index()
  @Column({ name: 'restaurant_id', nullable: false })
  public restaurantId: string;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @ManyToOne(() => User, (user) => user.bonuses)
  @JoinColumn({ name: 'user_id' })
  public user: User;
}
