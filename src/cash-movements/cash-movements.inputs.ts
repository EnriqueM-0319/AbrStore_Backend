import { Field, Float, InputType } from '@nestjs/graphql';
import { CashMovementType } from '../common/enums';

@InputType()
export class CreateCashMovementInput {
  @Field(() => CashMovementType)
  type!: CashMovementType;

  @Field(() => Float)
  amount!: number;

  @Field()
  description!: string;
}

@InputType()
export class UpdateCashMovementInput {
  @Field(() => Float)
  amount!: number;
}
