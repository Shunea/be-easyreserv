import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlaceType } from '../enums/place.type.enum';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';

@Entity()
export class Place {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column('enum', {
    name: 'place_type',
    enum: PlaceType,
    nullable: false,
  })
  public placeType: PlaceType;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.place, {
    cascade: true,
  })
  public restaurants: Restaurant[];
}
