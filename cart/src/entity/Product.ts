import { Column, BaseEntity, Entity, PrimaryColumn } from 'typeorm';

@Entity()
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
}
