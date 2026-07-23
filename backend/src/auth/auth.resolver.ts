import { Args, Mutation, ObjectType, Field, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';

@ObjectType()
class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => UserProfile)
  user: UserProfile;
}

@ObjectType()
class UserProfile {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  role: string;
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
}
