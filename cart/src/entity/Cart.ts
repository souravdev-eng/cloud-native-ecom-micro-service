import { Column, Entity, PrimaryGeneratedColumn, BaseEntity, ManyToOne } from 'typeorm';
import { Product } from './Product';

@Entity()
export class Cart extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 1 })
  quantity: number;

  @Column()
  userId: string;

  @Column({ default: 0 })
  total: number;

  @ManyToOne(() => Product, (product) => product.carts)
  product: Product;
}
