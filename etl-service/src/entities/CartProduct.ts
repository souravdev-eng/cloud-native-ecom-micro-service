import { Column, BaseEntity, Entity, PrimaryColumn, OneToMany } from 'typeorm';

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
}
