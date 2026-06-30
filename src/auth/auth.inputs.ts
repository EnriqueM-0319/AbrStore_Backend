import { Field, InputType } from '@nestjs/graphql';
import { Role } from '../common/enums';

@InputType()
export class LoginInput {
  @Field()
  username!: string;

  @Field()
  password!: string;
}

@InputType()
export class RegisterUserInput {
  @Field()
  fullName!: string;

  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field()
  phone!: string;

  @Field(() => Role, { nullable: true })
  role?: Role;
}
