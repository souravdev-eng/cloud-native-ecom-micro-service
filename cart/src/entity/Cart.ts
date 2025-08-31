import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  ManyToOne,
  VersionColumn,
} from 'typeorm';
import { Product } from './Product';

@Entity()
export class Cart extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 1 })
  quantity: number;

  @Column()
  userId: string;

  @VersionColumn()
  version: number;

  @ManyToOne(() => Product, (product) => product.carts)
  product: Product;
}
