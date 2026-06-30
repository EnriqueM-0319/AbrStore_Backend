import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { GraphqlContext } from '../common/interfaces';
import { SalesReport } from './dto';
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
}
