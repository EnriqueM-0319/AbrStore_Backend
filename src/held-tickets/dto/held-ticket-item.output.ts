import { Field, Float, ObjectType } from '@nestjs/graphql';
import { UnitType } from '../../common/enums';
import { Product } from '../../products/dto';

@ObjectType()
export class HeldTicketItem {
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

  @Field(() => Product, { nullable: true })
  product!: Product | null;
}
