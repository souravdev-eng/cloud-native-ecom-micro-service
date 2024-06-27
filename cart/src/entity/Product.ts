import { Column, BaseEntity, Entity, PrimaryColumn, OneToMany } from 'typeorm';
import { Cart } from './Cart';

@Entity('product')
export class Product extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  title: string;

  @Column()
  price: number;

  @Column()
  image: string;

  @Column()
  sellerId: string;

  @Column()
  quantity: number;

  @OneToMany(() => Cart, (cart) => cart.product)
  carts: Cart[];
}
