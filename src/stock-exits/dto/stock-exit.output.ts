import { Field, Float, ObjectType } from '@nestjs/graphql';
import { StockExitReason, UnitType } from '../../common/enums';
import { BasicUser } from '../../common/dto';

@ObjectType()
export class StockExit {
  @Field()
  id!: string;

  @Field(() => String, { nullable: true })
  productId!: string | null;

  @Field()
  sku!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => UnitType)
  unit!: UnitType;

  @Field(() => Float)
  quantity!: number;

  @Field(() => StockExitReason)
  reason!: StockExitReason;

  @Field(() => String, { nullable: true })
  note!: string | null;

  @Field()
  createdAt!: string;

  @Field(() => BasicUser)
  user!: BasicUser;
}
