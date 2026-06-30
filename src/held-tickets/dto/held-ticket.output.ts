import { Field, Float, ObjectType } from '@nestjs/graphql';
import { PaymentMethod } from '../../common/enums';
import { BasicUser } from '../../common/dto';
import { HeldTicketItem } from './held-ticket-item.output';

@ObjectType()
export class HeldTicket {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  note!: string | null;

  @Field(() => Float)
  itemCount!: number;

  @Field(() => Float)
  total!: number;

  @Field(() => PaymentMethod)
  paymentMethod!: PaymentMethod;

  @Field()
  createdAt!: string;

  @Field()
  updatedAt!: string;

  @Field(() => BasicUser)
  createdBy!: BasicUser;

  @Field(() => [HeldTicketItem])
  items!: HeldTicketItem[];
}
