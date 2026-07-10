import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProductSalesReportItem {
  @Field(() => String, { nullable: true })
  productId!: string | null;

  @Field()
  sku!: string;

  @Field()
  name!: string;

  @Field(() => Float)
  quantity!: number;

  @Field(() => Float)
  total!: number;

  @Field(() => Float)
  share!: number;
}
