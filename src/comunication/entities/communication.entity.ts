import { MaxLength } from 'class-validator';
import {
  BeforeInsert,
  BeforeUpdate,
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
import { CommunicationTypes } from './communication_types.entity';

@Entity()
export class Communication {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'title', type: 'text', nullable: false })
  @MaxLength(70)
  public title: string;

  @Column({ name: 'title_en', type: 'text', nullable: true })
  @MaxLength(70)
  public titleEn: string;

  @Column({ name: 'title_ro', type: 'text', nullable: true })
  @MaxLength(70)
  public titleRo: string;

  @Column({ name: 'title_ru', type: 'text', nullable: true })
  @MaxLength(70)
  public titleRu: string;

  @Column({ name: 'message', type: 'text', nullable: false })
  public message: string;

  @Column({ name: 'message_en', type: 'text', nullable: true })
  public messageEn: string;

  @Column({ name: 'message_ro', type: 'text', nullable: true })
  public messageRo: string;

  @Column({ name: 'message_ru', type: 'text', nullable: true })
  public messageRu: string;

  @Column({ name: 'start_date', nullable: false })
  public startDate: Date;

  @Column({ name: 'end_date', nullable: false })
  public endDate: Date;

  @Column({ name: 'discount', nullable: true })
  public discount: number;

  @Index()
  @Column({ name: 'restaurant_id', nullable: false })
  public restaurantId: string;

  @Index()
  @Column({ name: 'communication_type_id', nullable: false })
  public communicationTypeId: string;

  @Column({ name: 'send_message_date', nullable: false })
  public sendMessageDate: Date;

  @ManyToOne(
    () => CommunicationTypes,
    (communicationTypes) => communicationTypes.communications,
    { eager: true },
  )
  @JoinColumn({ name: 'communication_type_id' })
  public communicationTypes: CommunicationTypes;

  @BeforeInsert()
  @BeforeUpdate()
  async convertDateFields() {
    const dateFields = ['startDate', 'endDate', 'sendMessageDate'];

    for (const field of dateFields) {
      if (this[field]) {
        this[field] = new Date(this[field]);
      }
    }
  }
}
