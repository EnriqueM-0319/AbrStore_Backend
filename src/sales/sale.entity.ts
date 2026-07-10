import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CashRegisterSessionEntity } from '../cash-register';
import { PaymentMethod } from '../common/enums';
import { UserEntity } from '../users';
import { SaleItemEntity } from './sale-item.entity';

@Entity('sales')
@Index(['createdAt'])
@Index(['cashSessionId', 'createdAt'])
@Index(['canceledAt', 'createdAt'])
@Index(['creditPaidAt'])
@Index(['paymentMethod', 'createdAt'])
export class SaleEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int', unique: true, generated: 'increment' })
  folio!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  paymentTotal!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  itemCount!: string;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH })
  paymentMethod!: PaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  cashReceived!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  changeDue!: string | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'sellerId' })
  seller!: UserEntity;

  @Column()
  sellerId!: string;

  @ManyToOne(() => CashRegisterSessionEntity, { nullable: true })
  @JoinColumn({ name: 'cashSessionId' })
  cashSession!: CashRegisterSessionEntity | null;

  @Column({ type: 'uuid', nullable: true })
  cashSessionId!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt!: Date | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'canceledById' })
  canceledBy!: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  canceledById!: string | null;

  @Column({ type: 'varchar', nullable: true })
  cancelReason!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  creditPaidAt!: Date | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'creditPaidById' })
  creditPaidBy!: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  creditPaidById!: string | null;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  creditPaymentMethod!: PaymentMethod | null;

  @Column({ type: 'varchar', nullable: true })
  creditCustomerName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  creditNote!: string | null;

  @OneToMany(() => SaleItemEntity, (item) => item.sale, { cascade: true })
  items!: SaleItemEntity[];

  @CreateDateColumn()
  createdAt!: Date;
}
