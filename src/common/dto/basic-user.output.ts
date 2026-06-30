import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BasicUser {
  @Field()
  id!: string;

  @Field()
  fullName!: string;

  @Field()
  email!: string;
}
