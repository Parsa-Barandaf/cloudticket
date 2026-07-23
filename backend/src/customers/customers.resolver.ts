import { Args, Query, Resolver } from '@nestjs/graphql';
import { CustomersService } from './customers.service';
import { Customer } from '../common/models/customer.model';

@Resolver(() => Customer)
export class CustomersResolver {
  constructor(private customersService: CustomersService) {}

  @Query(() => [Customer])
  async customers() {
    return this.customersService.findAll();
  }

  @Query(() => Customer, { nullable: true })
  async customer(@Args('id') id: string) {
    return this.customersService.findById(id);
  }
}
