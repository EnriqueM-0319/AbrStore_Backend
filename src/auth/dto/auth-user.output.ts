import { Field, ObjectType } from '@nestjs/graphql';
import { Role } from '../../common/enums';
import { BasicUser } from '../../common/dto';

@ObjectType()
export class AuthUser extends BasicUser {
  @Field(() => String, { nullable: true })
  username!: string | null;

  @Field()
  phone!: string;

  @Field(() => Role)
  role!: Role;

  @Field()
  active!: boolean;
}
