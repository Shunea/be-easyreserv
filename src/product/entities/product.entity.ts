import { Category } from '@src/category/entities/category.entity';
import { ProductIngredient } from '@src/ingredient/entities/productIngredient.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Restaurant } from '@src/restaurant/entities/restaurant.entity';
import { Order } from '@src/reservation/entities/order.entity';
import { PreparationZones } from '../enums/preparation-zones.enum';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: false })
  public updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, default: null })
  public deletedAt: Date;

  @Column({ name: 'title', nullable: false })
  public title: string;

  @Column({ name: 'title_ro', nullable: true })
  public titleRo: string;

  @Column({ name: 'title_ru', nullable: true })
  public titleRu: string;

  @Column('decimal', {
    name: 'price',
    nullable: false,
    precision: 10,
    scale: 2,
    default: 0,
  })
  public price: number;

  @Column({ name: 'tva_type', nullable: false, default: 'A', length: 1 })
  public tvaType: string;

  @Column('decimal', {
    name: 'tva_percentage',
    nullable: false,
    precision: 5,
    scale: 2,
    default: 20.00,
  })
  public tvaPercentage: number;

  @Column('decimal', {
    name: 'masa_netto',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  public masaNetto: number;

  @Column({ name: 'weight', nullable: true })
  public weight: number;

  @Column({ name: 'image', nullable: true })
  public image: string;

  @Column('enum', {
    name: 'preparation_zone',
    enum: PreparationZones,
    nullable: false,
  })
  public preparationZone: PreparationZones;

  @Column({ name: 'preparation_time', nullable: true })
  public preparationTime: number;

  @Column({ name: 'recipe', nullable: true, type: 'text' })
  public recipe: string;

  @Column({ name: 'allergens', nullable: true })
  public allergens: string;

  @Column({ name: 'is_available', nullable: false, default: true })
  public isAvailable: boolean;

  @Index()
  @Column({ name: 'category_id', nullable: false })
  public categoryId: string;

  @Index()
  @Column({ name: 'restaurant_id', nullable: false })
  public restaurantId: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  public category: Category;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.products)
  @JoinColumn({ name: 'restaurant_id' })
  public restaurant: Restaurant;

  @OneToMany(
    () => ProductIngredient,
    (productIngredient) => productIngredient.product,
    { eager: true, cascade: true },
  )
  public productIngredients: ProductIngredient[];

  @OneToMany(() => Order, (order) => order.product)
  public orders: Order[];
}
