import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from '@src/product/entities/product.entity';
import { Ingredient } from '@src/ingredient/entities/ingredient.entity';

@Entity()
export class ProductIngredient {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'quantity', nullable: false })
  public quantity: number;

  @Index()
  @Column({ name: 'product_id', nullable: true })
  public productId: string;

  @Index()
  @Column({ name: 'ingredient_id', nullable: false })
  public ingredientId: string;

  @ManyToOne(() => Product, (product) => product.productIngredients)
  @JoinColumn({ name: 'product_id' })
  public product: Product;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.productIngredients, {
    eager: true,
  })
  @JoinColumn({ name: 'ingredient_id' })
  public ingredient: Ingredient;
}
