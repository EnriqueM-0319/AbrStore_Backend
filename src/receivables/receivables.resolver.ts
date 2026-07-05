import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PaymentMethod } from '../common/enums';
import { GraphqlContext } from '../common/interfaces';
import { PaginatedSales, SaleTicket } from '../sales/dto';
import { ReceivablesService } from './receivables.service';

@Resolver()
export class ReceivablesResolver {
  constructor(private readonly receivablesService: ReceivablesService) {}

  @Query(() => PaginatedSales)
  async receivables(
    @Context() context: GraphqlContext,
    @Args('status', { nullable: true }) statusInput?: string,
    @Args('page', { nullable: true }) page?: number,
    @Args('limit', { nullable: true }) limit?: number,
    @Args('search', { nullable: true }) search?: string,
  ) {
    return this.receivablesService.receivables(
      context,
      statusInput,
      page,
      limit,
      search,
    );
  }

  @Mutation(() => SaleTicket)
  async payReceivable(
    @Context() context: GraphqlContext,
    @Args('id') id: string,
    @Args('paymentMethod', { type: () => PaymentMethod, nullable: true })
    paymentMethod: PaymentMethod = PaymentMethod.CASH,
    @Args('cashReceived', { nullable: true }) cashReceived?: number,
  ) {
    return this.receivablesService.payReceivable(
      context,
      id,
      paymentMethod,
      cashReceived,
    );
  }
}
