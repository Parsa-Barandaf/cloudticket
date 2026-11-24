import {
  Args,
  Mutation,
  Query,
  Resolver,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { CustomersService } from './customers.service';
import { Customer } from '../common/models/customer.model';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../common/dto/customer.input';

@Resolver(() => Customer)
export class CustomersResolver {
  constructor(private customersService: CustomersService) {}

  @ResolveField()
  async activeProductsCount(@Parent() customer: any) {
    const connections = customer.connections ?? [];
    return connections.filter((c: any) => c.licenseStatus === 'ACTIVE').length;
  }

  @ResolveField()
  async usersCount(@Parent() customer: any) {
    const employees = customer.employees ?? [];
    const ownerIncluded = employees.some((e: any) => e.id === customer.userId);
    return employees.length + (ownerIncluded ? 0 : 1);
  }

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
