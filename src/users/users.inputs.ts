import { Field, InputType } from '@nestjs/graphql';
import { Role } from '../common/enums';

@InputType()
export class UpdateUserInput {
  @Field()
  fullName!: string;

  @Field()
  email!: string;

  @Field()
  phone!: string;

  @Field(() => Role, { nullable: true })
  role?: Role;

  @Field(() => String, { nullable: true })
  password?: string;

  @Field(() => Boolean, { nullable: true })
  active?: boolean;
}
