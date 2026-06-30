import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UnitType } from '../common/enums';
import { ProductEntity } from '../products';
import { SaleEntity } from './sale.entity';

@Entity('sale_items')
@Index(['saleId'])
export class SaleItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => SaleEntity, (sale) => sale.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale!: SaleEntity;

  @Column()
  saleId!: string;

  @ManyToOne(() => ProductEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productId' })
  product!: ProductEntity | null;

  @Column({ type: 'uuid', nullable: true })
  productId!: string | null;

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

  @Column({ type: 'timestamp', nullable: true })
  canceledAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  cancelReason!: string | null;
}
