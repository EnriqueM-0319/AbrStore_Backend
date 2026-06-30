import { Field, ObjectType } from '@nestjs/graphql';
import { PageInfo } from '../../common/dto';
import { CashMovement } from './cash-movement.output';

@ObjectType()
export class PaginatedCashMovements extends PageInfo {
  @Field(() => [CashMovement])
  items!: CashMovement[];
}
