import { Space } from '@src/place/entities/space.entity';
import {
  Entity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
  JoinColumn,
  ManyToOne,
  Index,
  DeleteDateColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { Shape } from '../enum/tableShape.enum';
import { Reservation } from '@src/reservation/entities/reservation.entity';

@Entity()
export class Table {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'table_name', nullable: false })
  public tableName: string;

  @Column({ name: 'seats', nullable: false })
  public seats: number;

  @Column('enum', {
    name: 'shape',
    enum: Shape,
    default: Shape.SMALL_SQUARE,
  })
  public shape: Shape;

  @Column({ name: 'x_coordinates', nullable: false })
  public xCoordinates: number;

  @Column({ name: 'y_coordinates', nullable: false })
  public yCoordinates: number;

  @Column({ name: 'rotation_angle', nullable: false, default: 0 })
  public rotationAngle: number;

  @Index()
  @Column({ name: 'space_id', nullable: false })
  public spaceId: string;

  @ManyToOne(() => Space, (space) => space.tables)
  @JoinColumn({ name: 'space_id' })
  public space: Space;

  @ManyToMany(() => Reservation)
  @JoinTable({
    name: 'reservation_table',
    joinColumn: {
      name: 'table_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'reservation_id',
      referencedColumnName: 'id',
    },
  })
  public reservations: Reservation[];
}
