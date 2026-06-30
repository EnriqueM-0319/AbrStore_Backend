import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CashMovementType } from '../common/enums';
import { CashRegisterSessionEntity } from '../cash-register';
import { UserEntity } from '../users';

@Entity('cash_movements')
@Index(['cashSessionId', 'createdAt'])
export class CashMovementEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => CashRegisterSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cashSessionId' })
  cashSession!: CashRegisterSessionEntity;

  @Column()
  cashSessionId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdById' })
  createdBy!: UserEntity;

  @Column()
  createdById!: string;

  @Column({ type: 'enum', enum: CashMovementType })
  type!: CashMovementType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column()
  description!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
