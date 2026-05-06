import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    BaseEntity,
    ManyToOne,
    JoinColumn,
    VersionColumn,
} from 'typeorm';
import { Product } from './CartProduct';

@Entity('cart')
export class Cart extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: 1 })
    quantity: number;

    @Column()
    userId: string;

    @VersionColumn()
    version: number;

    @Column({ name: 'productId' })
    productId: string;

    @ManyToOne(() => Product, { eager: true })
    @JoinColumn({ name: 'productId' })
    product: Product;
}

