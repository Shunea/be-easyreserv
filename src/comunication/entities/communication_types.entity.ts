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
import { Communication } from './communication.entity';

@Entity()
export class CommunicationTypes {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'type', nullable: false })
  public type: string;

  @Index()
  @Column({ name: 'restaurant_id', nullable: false })
  public restaurantId: string;

  @OneToMany(
    () => Communication,
    (communication) => communication.communicationTypes,
  )
  public communications: Communication[];
}
