import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphqlContext } from '../common/interfaces';
import { CashMovement, PaginatedCashMovements } from './dto';
import { CreateCashMovementInput } from './cash-movements.inputs';
import { CashMovementsService } from './cash-movements.service';

@Resolver()
export class CashMovementsResolver {
  constructor(private readonly cashMovementsService: CashMovementsService) {}

  @Query(() => PaginatedCashMovements)
  cashMovements(
    @Context() context: GraphqlContext,
    @Args('currentOnly', { nullable: true }) currentOnly?: boolean,
    @Args('page', { nullable: true }) page?: number,
    @Args('limit', { nullable: true }) limit?: number,
  ) {
    return this.cashMovementsService.cashMovements(
      context,
      currentOnly !== false,
      page,
      limit,
    );
  }

  @Mutation(() => CashMovement)
  createCashMovement(
    @Context() context: GraphqlContext,
    @Args('input') input: CreateCashMovementInput,
  ) {
    return this.cashMovementsService.create(context, input);
  }
}
