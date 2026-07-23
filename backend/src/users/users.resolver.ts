import { Query, Resolver } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from '../common/models/user.model';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => [User])
  async users() {
    return this.usersService.findAll();
  }
}
