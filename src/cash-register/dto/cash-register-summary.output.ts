import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CashRegisterSummary {
  @Field(() => Float)
  openingAmount!: number;

  @Field(() => Float)
  cashSalesTotal!: number;

  @Field(() => Int)
  cashSalesCount!: number;

  @Field(() => Float)
  cardSalesTotal!: number;

  @Field(() => Float)
  transferSalesTotal!: number;

  @Field(() => Float)
  creditSalesTotal!: number;

  @Field(() => Float)
  nonCashSalesTotal!: number;

  @Field(() => Float)
  cashInTotal!: number;

  @Field(() => Float)
  adjustmentTotal!: number;

  @Field(() => Float)
  supplierPaymentTotal!: number;

  @Field(() => Float)
  withdrawalTotal!: number;

  @Field(() => Float)
  expenseTotal!: number;

  @Field(() => Float)
  cashOutTotal!: number;

  @Field(() => Float)
  expectedAmount!: number;
}
