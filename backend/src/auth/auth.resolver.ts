import { Args, Mutation, Query, Resolver, ObjectType, Field, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { User } from '../common/models/user.model';

@ObjectType()
class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;
}

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  @Mutation(() => AuthPayload)
  async register(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('name') name: string,
  ) {
    return this.authService.register(email, password, name);
  }

  @Query(() => User)
  @UseGuards(AuthGuard('jwt'))
  async me(@Context() context: { req: { user: { id: string; email: string; name: string; role: string; customRoleId?: string | null; customRole?: { portalType: string } | null } } }) {
    const user = context.req.user;
    return {
      ...user,
      portalType: user.customRole?.portalType || null,
    };
  }
}
