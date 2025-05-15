import { User } from '@src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
  DeleteDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'key', nullable: false })
  public key: string;

  @Column({ name: 'type', nullable: false })
  public type: string;

  @Column({ name: 'number', nullable: false })
  public number: string;

  @Column({ name: 'document_name', nullable: true })
  public documentName: string;

  @Column({ name: 'expire_on', nullable: true })
  public expireOn: Date;

  @Column({ name: 'issued_on', nullable: true })
  public issuedOn: Date;

  @Index()
  @Column({ name: 'item_id', nullable: true })
  public itemId: string;

  @Index()
  @Column({ name: 'user_id', nullable: false })
  public userId: string;

  @ManyToOne(() => User, (user) => user.documents)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @BeforeInsert()
  @BeforeUpdate()
  async convertDateFields() {
    if (this.expireOn) {
      this.expireOn = new Date(this.expireOn);
    }
  }
}
