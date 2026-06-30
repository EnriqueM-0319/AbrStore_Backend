import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphqlContext } from '../common/interfaces';
import { OkResult } from '../common/dto';
import { CreateSaleInput } from '../sales/sales.inputs';
import { HeldTicket } from './dto';
import { HeldTicketsService } from './held-tickets.service';

@Resolver()
export class HeldTicketsResolver {
  constructor(private readonly heldTicketsService: HeldTicketsService) {}

  @Query(() => [HeldTicket])
  async heldTickets(@Context() context: GraphqlContext) {
    return this.heldTicketsService.heldTickets(context);
  }

  @Mutation(() => HeldTicket)
  async createHeldTicket(
    @Context() context: GraphqlContext,
    @Args('input') input: CreateSaleInput,
    @Args('note', { nullable: true }) note?: string,
  ) {
    return this.heldTicketsService.createHeldTicket(context, input, note);
  }

  @Mutation(() => OkResult)
  async deleteHeldTicket(
    @Context() context: GraphqlContext,
    @Args('id') id: string,
  ) {
    return this.heldTicketsService.deleteHeldTicket(context, id);
  }
}
