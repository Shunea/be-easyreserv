import { User } from '@src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  OneToOne,
  DeleteDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ type: 'text', name: 'token', nullable: false })
  public token: string;

  @Column({ name: 'expire_at', nullable: false })
  public expireAt: Date;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @OneToOne(() => User, (user) => user.refreshToken)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @BeforeInsert()
  @BeforeUpdate()
  async convertDateFields() {
    if (this.expireAt) {
      this.expireAt = new Date(this.expireAt);
    }
  }
}
