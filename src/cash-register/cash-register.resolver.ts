import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphqlContext } from '../common/interfaces';
import {
  CashRegisterCloseResult,
  CashRegisterSession,
  CashRegisterSummary,
} from './dto';
import {
  CloseCashRegisterInput,
  OpenCashRegisterInput,
} from './cash-register.inputs';
import { CashRegisterService } from './cash-register.service';

@Resolver()
export class CashRegisterResolver {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  @Query(() => CashRegisterSession, { nullable: true })
  currentCashRegister(@Context() context: GraphqlContext) {
    return this.cashRegisterService.current(context);
  }

  @Query(() => CashRegisterSummary, { nullable: true })
  cashRegisterSummary(@Context() context: GraphqlContext) {
    return this.cashRegisterService.summary(context);
  }

  @Mutation(() => CashRegisterSession)
  openCashRegister(
    @Context() context: GraphqlContext,
    @Args('input') input: OpenCashRegisterInput,
  ) {
    return this.cashRegisterService.open(
      context,
      input.openingAmount,
      input.notes,
    );
  }

  @Mutation(() => CashRegisterCloseResult)
  closeCashRegister(
    @Context() context: GraphqlContext,
    @Args('input') input: CloseCashRegisterInput,
  ) {
    return this.cashRegisterService.close(
      context,
      input.closingAmount,
      input.notes,
    );
  }
}
