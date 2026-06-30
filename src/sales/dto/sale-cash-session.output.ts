import { Field, ObjectType } from '@nestjs/graphql';
import { CashRegisterStatus } from '../../common/enums';

@ObjectType()
export class SaleCashSession {
  @Field()
  id!: string;

  @Field()
  openedAt!: string;

  @Field(() => CashRegisterStatus)
  status!: CashRegisterStatus;
}
