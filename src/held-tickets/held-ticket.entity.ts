import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethod } from '../common/enums';
import { UserEntity } from '../users';
import { HeldTicketItemEntity } from './held-ticket-item.entity';

@Entity('held_tickets')
@Index(['cashSessionId', 'updatedAt'])
export class HeldTicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', nullable: true })
  note!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  itemCount!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: string;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH })
  paymentMethod!: PaymentMethod;

  @Column()
  cashSessionId!: string;

  @Column()
  createdById!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'createdById' })
  createdBy!: UserEntity;

  @OneToMany(() => HeldTicketItemEntity, (item) => item.heldTicket, {
    cascade: true,
  })
  items!: HeldTicketItemEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
