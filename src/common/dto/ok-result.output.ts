import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OkResult {
  @Field()
  ok!: boolean;
}
