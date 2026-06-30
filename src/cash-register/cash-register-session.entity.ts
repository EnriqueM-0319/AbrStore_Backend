import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CashRegisterStatus } from '../common/enums';
import { UserEntity } from '../users';

@Entity('cash_register_sessions')
@Index(['status', 'openedAt'])
export class CashRegisterSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: CashRegisterStatus,
    default: CashRegisterStatus.OPEN,
  })
  status!: CashRegisterStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  openingAmount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  closingAmount!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  expectedAmount!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  difference!: string | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'openedById' })
  openedBy!: UserEntity;

  @Column()
  openedById!: string;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'closedById' })
  closedBy!: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  closedById!: string | null;

  @Column({ type: 'varchar', nullable: true })
  notes!: string | null;

  @CreateDateColumn()
  openedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt!: Date | null;
}
