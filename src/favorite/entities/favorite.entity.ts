import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '@src/user/entities/user.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';

@Entity()
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @Index()
  @Column({ name: 'restaurant_id', nullable: true })
  public restaurantId: string;

  @ManyToOne(() => User, (user) => user.favorites)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.favorites)
  @JoinColumn({ name: 'restaurant_id' })
  public restaurant: Restaurant;
}
