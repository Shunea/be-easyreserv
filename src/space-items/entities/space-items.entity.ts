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
import { SpaceItemType } from '../enum/space_items.enum';
import { Space } from '@src/place/entities/space.entity';

@Entity()
export class SpaceItems {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column('enum', {
    name: 'item_type',
    enum: SpaceItemType,
    default: SpaceItemType.NO_ITEM,
  })
  public itemType: SpaceItemType;

  @Column({ name: 'x_coordinates', nullable: false })
  public xCoordinates: number;

  @Column({ name: 'y_coordinates', nullable: false })
  public yCoordinates: number;

  @Index()
  @Column({ name: 'space_id', nullable: false })
  public spaceId: string;

  @ManyToOne(() => Space, (space) => space.spaceItems)
  @JoinColumn({ name: 'space_id' })
  public space: Space;
}
