import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductSalesPeriodReportItem {
  @Field()
  period!: string;

  @Field(() => Float)
  quantity!: number;

  @Field(() => Float)
  total!: number;
}
