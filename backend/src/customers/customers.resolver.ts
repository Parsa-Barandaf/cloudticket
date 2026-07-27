import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CustomersService } from './customers.service';
import { Customer } from '../common/models/customer.model';
import { CreateCustomerInput, UpdateCustomerInput } from '../common/dto/customer.input';

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

  @Mutation(() => Customer)
  async createCustomer(@Args('input') input: CreateCustomerInput) {
    return this.customersService.create(input);
  }

  @Mutation(() => Customer)
  async updateCustomer(@Args('input') input: UpdateCustomerInput) {
    return this.customersService.update(input);
  }

  @Mutation(() => Boolean)
  async deleteCustomer(@Args('id') id: string) {
    return this.customersService.delete(id);
  }
}
