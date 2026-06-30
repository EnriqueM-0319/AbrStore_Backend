import { Field, Float, ObjectType } from '@nestjs/graphql';
import { CashRegisterStatus } from '../../common/enums';
import { BasicUser } from '../../common/dto';

@ObjectType()
export class CashRegisterSession {
  @Field()
  id!: string;

  @Field(() => CashRegisterStatus)
  status!: CashRegisterStatus;

  @Field(() => Float)
  openingAmount!: number;

  @Field(() => Float, { nullable: true })
  closingAmount!: number | null;

  @Field(() => Float, { nullable: true })
  expectedAmount!: number | null;

  @Field(() => Float, { nullable: true })
  difference!: number | null;

  @Field(() => String, { nullable: true })
  notes!: string | null;

  @Field()
  openedAt!: string;

  @Field(() => String, { nullable: true })
  closedAt!: string | null;

  @Field(() => BasicUser)
  openedBy!: BasicUser;

  @Field(() => BasicUser, { nullable: true })
  closedBy!: BasicUser | null;
}
