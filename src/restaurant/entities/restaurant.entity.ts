import { Place } from '@src/place/entities/place.entity';
import { Space } from '@src/place/entities/space.entity';
import { CuisineType } from '@src/restaurant/enum/place-cuisine.enum';
import { WorkSchedule } from '@src/place/interfaces/work-schedule.interface';
import { Product } from '@src/product/entities/product.entity';
import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { Review } from '@src/review/entities/review.entity';
import { Favorite } from '@src/favorite/entities/favorite.entity';
import { Reservation } from '@src/reservation/entities/reservation.entity';
import { PlanHistory } from '@src/plan/entities/planHistory.entity';
import {Pos} from "@src/pos/entities/pos.entity";

@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'name', nullable: false })
  public name: string;

  @Column({ name: 'email', nullable: false })
  public email: string;

  @Column({ name: 'phone_number', nullable: false })
  public phoneNumber: string;

  @Column({ name: 'image', nullable: true })
  public image: string;

  @Column({ name: 'image_galery', nullable: true })
  public imageGalery: string;

  @Column('enum', {
    name: 'cuisine_type',
    enum: CuisineType,
    default: CuisineType.EUROPEAN_CUISINE,
  })
  public cuisineType: CuisineType;

  @Column({ name: 'work_schedule', type: 'json', nullable: false })
  public workSchedule: WorkSchedule;

  @Column({ name: 'latitude', type: 'double precision', nullable: true })
  public latitude: number;

  @Column({ name: 'longitude', type: 'double precision', nullable: true })
  public longitude: number;

  @Column({ name: 'address', nullable: true })
  public address: string;

  @Column({ name: 'sector', nullable: true, unique: false })
  public sector: string;

  @Column({ name: 'city', nullable: true, unique: false })
  public city: string;

  @Column({ name: 'is_hidden', nullable: false, default: false })
  public isHidden: boolean;

  @Index()
  @Column({ name: 'place_id', nullable: false })
  public placeId: string;

  @ManyToOne(() => Place, (place) => place.restaurants)
  @JoinColumn({ name: 'place_id' })
  public place: Place;

  @OneToMany(() => Space, (space) => space.restaurant, { cascade: true })
  public spaces: Space[];

  @OneToMany(() => Reservation, (reservation) => reservation.restaurant, {
    cascade: true,
  })
  public reservations: Reservation[];

  @OneToMany(() => Product, (product) => product.restaurant, {
    eager: true,
    cascade: true,
  })
  public products: Product[];

  @OneToMany(() => Review, (review) => review.restaurant)
  public reviews: Review[];

  @OneToMany(() => Favorite, (favorite) => favorite.restaurant, {
    cascade: true,
  })
  public favorites: Favorite[];

  @OneToMany(() => PlanHistory, (planHistory) => planHistory.restaurant, {
    cascade: true,
  })
  public planHistories: PlanHistory[];

  @Column({ type: 'boolean', default: false })
  delivery_enabled: boolean;

  @OneToMany(() => Pos, (pos) => pos.restaurant)
  public posDevices: Pos[];
}
