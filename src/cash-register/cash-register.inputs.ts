import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class OpenCashRegisterInput {
  @Field(() => Float)
  openingAmount!: number;

  @Field(() => String, { nullable: true })
  notes?: string;
}

@InputType()
export class CloseCashRegisterInput {
  @Field(() => Float)
  closingAmount!: number;

  @Field(() => String, { nullable: true })
  notes?: string;
}
