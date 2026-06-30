import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UnitType } from '../common/enums';
import { ProductEntity } from '../products';
import { HeldTicketEntity } from './held-ticket.entity';

@Entity('held_ticket_items')
export class HeldTicketItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => HeldTicketEntity, (ticket) => ticket.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'heldTicketId' })
  heldTicket!: HeldTicketEntity;

  @Column()
  heldTicketId!: string;

  @Column({ type: 'uuid', nullable: true })
  productId!: string | null;

  @ManyToOne(() => ProductEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productId' })
  product!: ProductEntity | null;

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

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  lineTotal!: string;
}
