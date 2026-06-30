import { Field, Float, ObjectType } from '@nestjs/graphql';
import { CashMovementType } from '../../common/enums';
import { BasicUser } from '../../common/dto';

@ObjectType()
export class CashMovement {
  @Field()
  id!: string;

  @Field()
  cashSessionId!: string;

  @Field(() => CashMovementType)
  type!: CashMovementType;

  @Field(() => Float)
  amount!: number;

  @Field()
  description!: string;

  @Field()
  createdAt!: string;

  @Field(() => BasicUser)
  createdBy!: BasicUser;
}
