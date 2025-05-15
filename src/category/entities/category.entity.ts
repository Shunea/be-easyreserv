import { Product } from '@src/product/entities/product.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class Category {
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

  @Column({ name: 'name_ro', nullable: true })
  public nameRo: string;

  @Column({ name: 'name_ru', nullable: true })
  public nameRu: string;

  @OneToMany(() => Product, (product) => product.category)
  public products: Product[];
}
