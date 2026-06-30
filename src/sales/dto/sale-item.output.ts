import { Field, Float, ObjectType } from '@nestjs/graphql';
import { UnitType } from '../../common/enums';

@ObjectType()
export class SaleItem {
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

  @Field(() => Float)
  unitPrice!: number;

  @Field(() => Float)
  lineTotal!: number;

  @Field(() => String, { nullable: true })
  canceledAt!: string | null;

  @Field(() => String, { nullable: true })
  cancelReason!: string | null;
}
