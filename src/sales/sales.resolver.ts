import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphqlContext } from '../common/interfaces';
import { PaginatedSales, SaleTicket } from './dto';
import { CreateSaleInput } from './sales.inputs';
import { SalesService } from './sales.service';

@Resolver()
export class SalesResolver {
  constructor(private readonly salesService: SalesService) {}

  @Query(() => PaginatedSales)
  sales(
    @Context() context: GraphqlContext,
    @Args('page', { nullable: true }) page?: number,
    @Args('limit', { nullable: true }) limit?: number,
    @Args('startDate', { nullable: true }) startDate?: string,
    @Args('endDate', { nullable: true }) endDate?: string,
    @Args('folio', { nullable: true }) folio?: number,
  ) {
    return this.salesService.findSales(context, {
      page,
      limit,
      startDate,
      endDate,
      folio,
    });
  }

  @Mutation(() => SaleTicket)
  createSale(
    @Context() context: GraphqlContext,
    @Args('input') input: CreateSaleInput,
  ) {
    return this.salesService.createSale(context, input);
  }

  @Mutation(() => SaleTicket)
  cancelSale(
    @Context() context: GraphqlContext,
    @Args('id') id: string,
    @Args('reason') reason: string,
  ) {
    return this.salesService.cancelSale(context, id, reason);
  }

  @Mutation(() => SaleTicket)
  cancelSaleItem(
    @Context() context: GraphqlContext,
    @Args('id') id: string,
    @Args('itemId') itemId: string,
    @Args('reason') reason: string,
  ) {
    return this.salesService.cancelSaleItem(context, id, itemId, reason);
  }
}
