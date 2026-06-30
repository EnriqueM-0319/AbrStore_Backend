import { Field, Float, InputType } from '@nestjs/graphql';
import { UnitType } from '../common/enums';

@InputType()
export class ProductInput {
  @Field()
  sku!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Float)
  costPrice!: number;

  @Field(() => Float)
  profitMargin!: number;

  @Field(() => Float)
  price!: number;

  @Field(() => UnitType)
  unit!: UnitType;

  @Field(() => Float)
  stock!: number;

  @Field(() => Boolean, { nullable: true })
  active?: boolean;
}
