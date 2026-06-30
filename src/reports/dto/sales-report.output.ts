import { Field, ObjectType } from '@nestjs/graphql';
import { SalesReportItem } from './sales-report-item.output';

@ObjectType()
export class SalesReport {
  @Field()
  groupBy!: string;

  @Field()
  startDate!: string;

  @Field()
  endDate!: string;

  @Field(() => SalesReportItem)
  summary!: SalesReportItem;

  @Field(() => [SalesReportItem])
  items!: SalesReportItem[];
}
