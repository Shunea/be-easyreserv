import { User } from '@src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Transport {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'registration_number', nullable: false, unique: true })
  public registrationNumber: string;

  @Column({ name: 'seats', nullable: false })
  public seats: number;

  @Column({ name: 'mileage', nullable: false, default: 0 })
  public mileage: number;

  @Column({ name: 'region', nullable: false })
  public region: string;

  @Column({ name: 'type', nullable: false })
  public type: string;

  @Column({ name: 'restaurant_id', nullable: false })
  public restaurantId: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'transport_user',
    joinColumn: {
      name: 'transport_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  public users: User[];
}
