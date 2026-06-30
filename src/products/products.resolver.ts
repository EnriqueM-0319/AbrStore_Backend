import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphqlContext } from '../common/interfaces';
import { OkResult } from '../common/dto';
import { Product } from './dto';
import { ProductInput } from './products.inputs';
import { ProductsService } from './products.service';

@Resolver()
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => [Product])
  products(
    @Context() context: GraphqlContext,
    @Args('search', { nullable: true }) search?: string,
  ) {
    return this.productsService.searchProducts(context, search);
  }

  @Query(() => [Product])
  manageProducts(@Context() context: GraphqlContext) {
    return this.productsService.manageProducts(context);
  }

  @Mutation(() => Product)
  createProduct(
    @Context() context: GraphqlContext,
    @Args('input') input: ProductInput,
  ) {
    return this.productsService.createProduct(context, input);
  }

  @Mutation(() => Product)
  updateProduct(
    @Context() context: GraphqlContext,
    @Args('id') id: string,
    @Args('input') input: ProductInput,
  ) {
    return this.productsService.updateProduct(context, id, input);
  }

  @Mutation(() => OkResult)
  deleteProduct(
    @Context() context: GraphqlContext,
    @Args('id') id: string,
    @Args('permanent', { nullable: true }) permanent?: boolean,
  ) {
    return this.productsService.deleteProduct(context, id, permanent);
  }
}
