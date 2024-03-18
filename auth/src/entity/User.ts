<<<<<<< HEAD
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, BeforeInsert } from 'typeorm';
=======
import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, BeforeInsert, AfterUpdate } from 'typeorm';
>>>>>>> 4e85ca3e6933b05cb3e978c54cb24826221546b5
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

<<<<<<< HEAD
=======
  @Column({ nullable: true })
  resetToken: string;

>>>>>>> 4e85ca3e6933b05cb3e978c54cb24826221546b5
  @BeforeInsert()
  async beforeInsert() {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConform = await bcrypt.hash(this.password, 12);
  }
}
