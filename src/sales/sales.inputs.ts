import { Field, Float, InputType } from '@nestjs/graphql';
import { PaymentMethod, UnitType } from '../common/enums';

@InputType()
export class SaleRequestItemInput {
  @Field(() => String, { nullable: true })
  productId?: string;

  @Field(() => Float, { nullable: true })
  quantity?: number;

  @Field(() => Boolean, { nullable: true })
  manual?: boolean;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => Float, { nullable: true })
  price?: number;

  @Field(() => UnitType, { nullable: true })
  unit?: UnitType;
}

@InputType()
export class CreateSaleInput {
  @Field(() => [SaleRequestItemInput])
  items!: SaleRequestItemInput[];

  @Field(() => PaymentMethod, { nullable: true })
  paymentMethod?: PaymentMethod;

  @Field(() => Float, { nullable: true })
  cashReceived?: number;

  @Field(() => String, { nullable: true })
  creditCustomerName?: string;

  @Field(() => String, { nullable: true })
  creditNote?: string;
}
