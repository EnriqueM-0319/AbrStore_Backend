import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { PaymentMethod } from '../../common/enums';
import { BasicUser } from '../../common/dto';
import { SaleCashSession } from './sale-cash-session.output';
import { SaleItem } from './sale-item.output';

@ObjectType()
export class SaleTicket {
  @Field()
  id!: string;

  @Field(() => Int)
  folio!: number;

  @Field(() => Float)
  total!: number;

  @Field(() => Float)
  paymentTotal!: number;

  @Field(() => Float)
  itemCount!: number;

  @Field(() => PaymentMethod)
  paymentMethod!: PaymentMethod;

  @Field(() => Float, { nullable: true })
  cashReceived!: number | null;

  @Field(() => Float, { nullable: true })
  changeDue!: number | null;

  @Field(() => String, { nullable: true })
  canceledAt!: string | null;

  @Field(() => String, { nullable: true })
  cancelReason!: string | null;

  @Field(() => BasicUser, { nullable: true })
  canceledBy!: BasicUser | null;

  @Field(() => String, { nullable: true })
  creditPaidAt!: string | null;

  @Field(() => BasicUser, { nullable: true })
  creditPaidBy!: BasicUser | null;

  @Field(() => PaymentMethod, { nullable: true })
  creditPaymentMethod!: PaymentMethod | null;

  @Field(() => String, { nullable: true })
  creditCustomerName!: string | null;

  @Field(() => String, { nullable: true })
  creditNote!: string | null;

  @Field()
  canCancel!: boolean;

  @Field()
  createdAt!: string;

  @Field(() => BasicUser)
  seller!: BasicUser;

  @Field(() => SaleCashSession, { nullable: true })
  cashSession!: SaleCashSession | null;

  @Field(() => [SaleItem])
  items!: SaleItem[];
}
