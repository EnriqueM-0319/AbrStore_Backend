import { Field, Float, ObjectType } from '@nestjs/graphql';
import { UnitType } from '../../common/enums';

@ObjectType()
export class Product {
  @Field()
  id!: string;

  @Field()
  sku!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => Float, { nullable: true })
  costPrice?: number;

  @Field(() => Float, { nullable: true })
  profitMargin?: number;

  @Field(() => Float)
  price!: number;

  @Field(() => UnitType)
  unit!: UnitType;

  @Field(() => Float)
  stock!: number;

  @Field(() => Boolean, { nullable: true })
  active?: boolean;
}
