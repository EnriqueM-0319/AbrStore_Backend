import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UnitType } from '../common/enums';

@Entity('products')
@Index(['name'])
@Index(['active', 'updatedAt'])
@Index(['active', 'stock'])
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  sku!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  costPrice!: string;

  @Column({ type: 'decimal', precision: 7, scale: 2, default: 0 })
  profitMargin!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: string;

  @Column({ type: 'enum', enum: UnitType, default: UnitType.PIECE })
  unit!: UnitType;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  stock!: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
