import {
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
import { Exclude } from 'class-transformer';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { SpaceItems } from '@src/space-items/entities/space-items.entity';
import { Table } from '@src/table/entities/table.entity';

@Entity()
export class Space {
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

  @Column({ name: 'duration' })
  public duration: number;

  @Column({ name: 'height', nullable: true })
  public height: number;

  @Column({ name: 'width', nullable: true })
  public width: number;

  @Index()
  @Column({ name: 'restaurant_id' })
  public restaurantId: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.spaces)
  @Exclude({ toPlainOnly: true })
  @JoinColumn({ name: 'restaurant_id' })
  public restaurant: Restaurant;

  @OneToMany(() => Table, (table) => table.space, {
    eager: true,
    cascade: true,
  })
  public tables: Table[];

  @OneToMany(() => SpaceItems, (spaceItems) => spaceItems.space, {
    eager: true,
    cascade: true,
  })
  public spaceItems: SpaceItems[];
}
