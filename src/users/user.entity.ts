import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../common/enums';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  username!: string | null;

  @Column()
  passwordHash!: string;

  @Column()
  phone!: string;

  @Column({ type: 'enum', enum: Role, default: Role.WORKER })
  role!: Role;

  @Column({ default: true })
  active!: boolean;
}
