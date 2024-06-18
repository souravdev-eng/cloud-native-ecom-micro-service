import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, BeforeInsert } from 'typeorm';
import bcrypt from 'bcryptjs';

@Entity('user')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ select: false, nullable: true })
  passwordConform: string;

  @Column({ default: 'user', enum: ['user', 'seller', 'admin'] })
  role: string;

  @Column({ nullable: true })
  resetToken: string;

  @BeforeInsert()
  async beforeInsert() {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConform = await bcrypt.hash(this.password, 12);
  }
}
