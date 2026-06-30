import { Field, ObjectType } from '@nestjs/graphql';
import { CashRegisterSession } from './cash-register-session.output';
import { CashRegisterSummary } from './cash-register-summary.output';

@ObjectType()
export class CashRegisterCloseResult {
  @Field(() => CashRegisterSession)
  session!: CashRegisterSession;

  @Field(() => CashRegisterSummary)
  summary!: CashRegisterSummary;
}
