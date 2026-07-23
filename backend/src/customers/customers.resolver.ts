import { Query, Resolver } from '@nestjs/graphql';
import { CustomersService } from './customers.service';

@Resolver()
export class CustomersResolver {
  constructor(private customersService: CustomersService) {}

  @Query(() => String)
  async customers() {
    return 'customers placeholder';
  }
}
