import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { StockExitReason } from '../common/enums';
import { GraphqlContext } from '../common/interfaces';
import { PaginatedStockExits, StockExit } from './dto';
import { StockExitsService } from './stock-exits.service';

@Resolver()
export class StockExitsResolver {
  constructor(private readonly stockExitsService: StockExitsService) {}

  @Query(() => PaginatedStockExits)
  async stockExits(
    @Context() context: GraphqlContext,
    @Args('page', { nullable: true }) page?: number,
    @Args('limit', { nullable: true }) limit?: number,
  ) {
    return this.stockExitsService.stockExits(context, page, limit);
  }

  @Mutation(() => StockExit)
  async createStockExit(
    @Context() context: GraphqlContext,
    @Args('productId') productId: string,
    @Args('quantity') quantityValue: number,
    @Args('reason', { type: () => StockExitReason }) reason: StockExitReason,
    @Args('note', { nullable: true }) note?: string,
  ) {
    return this.stockExitsService.createStockExit(
      context,
      productId,
      quantityValue,
      reason,
      note,
    );
  }
}
