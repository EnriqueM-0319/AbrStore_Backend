import { Args, Context, Int, Query, Resolver } from '@nestjs/graphql';
import { GraphqlContext } from '../common/interfaces';
import { ProductSalesReport, SalesReport } from './dto';
import { ReportsService } from './reports.service';

@Resolver()
export class ReportsResolver {
  constructor(private readonly reportsService: ReportsService) {}

  @Query(() => SalesReport)
  async salesReport(
    @Context() context: GraphqlContext,
    @Args('groupBy', { nullable: true }) groupByInput?: string,
    @Args('startDate', { nullable: true }) startDateInput?: string,
    @Args('endDate', { nullable: true }) endDateInput?: string,
  ) {
    return this.reportsService.salesReport(
      context,
      groupByInput,
      startDateInput,
      endDateInput,
    );
  }

  @Query(() => ProductSalesReport)
  async productSalesReport(
    @Context() context: GraphqlContext,
    @Args('groupBy', { nullable: true }) groupByInput?: string,
    @Args('startDate', { nullable: true }) startDateInput?: string,
    @Args('endDate', { nullable: true }) endDateInput?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ) {
    return this.reportsService.productSalesReport(
      context,
      groupByInput,
      startDateInput,
      endDateInput,
      limit,
    );
  }
}
