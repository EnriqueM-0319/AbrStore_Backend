import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphqlContext } from '../common/interfaces';
import { OkResult } from '../common/dto';
import { AuthService } from './auth.service';
import { LoginInput, RegisterUserInput } from './auth.inputs';
import { AuthUser } from './dto';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Query(() => AuthUser)
  me(@Context() context: GraphqlContext) {
    return this.authService.me(context);
  }

  @Mutation(() => AuthUser)
  login(@Context() context: GraphqlContext, @Args('input') input: LoginInput) {
    return this.authService.login(context, input.username, input.password);
  }

  @Mutation(() => OkResult)
  logout(@Context() context: GraphqlContext) {
    return this.authService.logout(context);
  }

  @Mutation(() => AuthUser)
  registerUser(
    @Context() context: GraphqlContext,
    @Args('input') input: RegisterUserInput,
  ) {
    return this.authService.register(context, input);
  }
}
