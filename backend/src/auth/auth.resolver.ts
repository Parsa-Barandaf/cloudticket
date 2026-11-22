import {
  Args,
  Mutation,
  Query,
  Resolver,
  ObjectType,
  Field,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GqlAuthGuard } from './gql-auth.guard';
import { RolesService } from '../roles/roles.service';
import { User } from '../common/models/user.model';

@ObjectType()
class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;

  @Field(() => [String])
  accessiblePortals: string[];

  @Field(() => [String])
  permissions: string[];
}

@ObjectType()
class MePayload {
  @Field(() => User)
  user: User;

  @Field(() => [String])
  accessiblePortals: string[];

  @Field(() => [String])
  permissions: string[];
}

@Resolver()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private rolesService: RolesService,
  ) {}

  @Mutation(() => AuthPayload)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('rememberMe', {
      type: () => Boolean,
      nullable: true,
      defaultValue: false,
    })
    rememberMe?: boolean,
  ) {
    return this.authService.login(email, password, rememberMe);
  }

  @Mutation(() => AuthPayload)
  async register(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('name') name: string,
  ) {
    return this.authService.register(email, password, name);
  }

  @Query(() => MePayload)
  @UseGuards(GqlAuthGuard)
  async me(@Context() context: any) {
    const user = context.req.user;
    const effective = await this.rolesService.getUserEffectivePermissions(
      user.id,
    );
    return {
      user,
      accessiblePortals: effective.accessiblePortals,
      permissions: effective.permissions.map((p: { key: string }) => p.key),
    };
  }
}
