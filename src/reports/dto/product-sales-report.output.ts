import { Field, Float, ObjectType } from '@nestjs/graphql';
import { ProductSalesPeriodReportItem } from './product-sales-period-report-item.output';
import { ProductSalesReportItem } from './product-sales-report-item.output';

@ObjectType()
export class ProductSalesReport {
  @Field()
  groupBy!: string;

  @Field()
  startDate!: string;

  @Field()
  endDate!: string;

  @Field(() => Float)
  totalQuantity!: number;

  @Field(() => Float)
  totalAmount!: number;

  @Field(() => ProductSalesReportItem, { nullable: true })
  topProduct!: ProductSalesReportItem | null;

  @Field(() => ProductSalesReportItem, { nullable: true })
  lowestProduct!: ProductSalesReportItem | null;

  @Field(() => [ProductSalesReportItem])
  items!: ProductSalesReportItem[];

  @Field(() => [ProductSalesPeriodReportItem])
  periodItems!: ProductSalesPeriodReportItem[];
}
