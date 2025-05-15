import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity, Index, JoinColumn,
  ManyToOne, OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ingredient } from '@src/ingredient/entities/ingredient.entity';
import { Product } from '@src/product/entities/product.entity';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { ProductIngredient } from '@src/ingredient/entities/productIngredient.entity';

@Entity()
export class SemifinishedProduct {
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

  @Column({ name: 'weight_formula', nullable: false })
  public weight_formula: string;

  @Column({ name: 'quantity', nullable: false })
  public weight: number;

  @Index()
  @Column({ name: 'restaurant_id', nullable: false })
  public restaurantId: string;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.products)
  @JoinColumn({ name: 'restaurant_id' })
  public restaurant: Restaurant;

  @ManyToOne(() => Product, (product) => product.productIngredients)
  @JoinColumn({ name: 'product_id' })
  public product: Product;

  @OneToMany(
    () => ProductIngredient,
    (productIngredient) => productIngredient.product,
    { eager: true, cascade: true },
  )
  public productIngredients: ProductIngredient[];
}