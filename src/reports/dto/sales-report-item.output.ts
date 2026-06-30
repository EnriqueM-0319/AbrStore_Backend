import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SalesReportItem {
  @Field()
  period!: string;

  @Field(() => Int)
  salesCount!: number;

  @Field(() => Int)
  canceledCount!: number;

  @Field(() => Float)
  grossTotal!: number;

  @Field(() => Float)
  cashTotal!: number;

  @Field(() => Float)
  cardTotal!: number;

  @Field(() => Float)
  transferTotal!: number;

  @Field(() => Float)
  creditTotal!: number;

  @Field(() => Float)
  creditPendingTotal!: number;

  @Field(() => Float)
  creditPaidTotal!: number;

  @Field(() => Float)
  creditCollectedCashTotal!: number;

  @Field(() => Float)
  creditCollectedCardTotal!: number;

  @Field(() => Float)
  creditCollectedTransferTotal!: number;

  @Field(() => Float)
  creditCollectedTotal!: number;

  @Field(() => Float)
  averageTicket!: number;
}
