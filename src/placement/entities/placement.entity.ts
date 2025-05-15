import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { User } from '@src/user/entities/user.entity';
import { Place } from '@src/place/entities/place.entity';

@Entity()
export class Placement {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'title_en', type: 'text', nullable: false })
  public titleEn: string;

  @Column({ name: 'title_ro', type: 'text', nullable: false })
  public titleRo: string;

  @Column({ name: 'title_ru', type: 'text', nullable: false })
  public titleRu: string;

  @Column({ name: 'text_en', type: 'text', nullable: false })
  public textEn: string;

  @Column({ name: 'text_ro', type: 'text', nullable: false })
  public textRo: string;

  @Column({ name: 'text_ru', type: 'text', nullable: false })
  public textRu: string;

  @Column({ name: 'image', nullable: true })
  public image: string;

  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @ManyToOne(() => User, (user) => user.placeId, {
    cascade: true,
  })
  public user: User;

  @OneToOne(() => Place, (place) => place.id, {})
  public place: Place;

  @OneToMany(() => Restaurant, (restaurant) => restaurant.id, {})
  public restaurants: Restaurant[];
}
