import { Args, Context, Query, Resolver } from '@nestjs/graphql';
import { GraphqlContext } from '../common/interfaces';
import { PaginatedProducts } from '../products/dto';
import { InventoryService } from './inventory.service';

@Resolver()
export class InventoryResolver {
  constructor(private readonly inventoryService: InventoryService) {}

  @Query(() => PaginatedProducts)
  inventory(
    @Context() context: GraphqlContext,
    @Args('search', { nullable: true }) search?: string,
    @Args('lowStock', { nullable: true }) lowStock?: boolean,
    @Args('page', { nullable: true }) page?: number,
    @Args('limit', { nullable: true }) limit?: number,
  ) {
    return this.inventoryService.inventory(context, {
      search,
      lowStock,
      page,
      limit,
    });
  }
}
