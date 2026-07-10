import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockExitReason, UnitType } from '../common/enums';
import { UserEntity } from '../users';

@Entity('stock_exits')
@Index(['createdAt'])
@Index(['productId', 'createdAt'])
export class StockExitEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  productId!: string | null;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'enum', enum: StockExitReason })
  reason!: StockExitReason;

  @Column()
  sku!: string;

  @Column()
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: UnitType })
  unit!: UnitType;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity!: string;

  @Column({ type: 'varchar', nullable: true })
  note!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
