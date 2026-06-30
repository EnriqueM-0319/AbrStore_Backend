import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphqlContext } from '../common/interfaces';
import { AuthUser } from '../auth/dto';
import { UpdateUserInput } from './users.inputs';
import { UsersService } from './users.service';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [AuthUser])
  users(
    @Context() context: GraphqlContext,
    @Args('search', { nullable: true }) search?: string,
  ) {
    return this.usersService.users(context, search);
  }

  @Mutation(() => AuthUser)
  updateUser(
    @Context() context: GraphqlContext,
    @Args('id') id: string,
    @Args('input') input: UpdateUserInput,
  ) {
    return this.usersService.updateUser(context, id, input);
  }

  @Mutation(() => AuthUser)
  deactivateUser(@Context() context: GraphqlContext, @Args('id') id: string) {
    return this.usersService.deactivateUser(context, id);
  }
}
