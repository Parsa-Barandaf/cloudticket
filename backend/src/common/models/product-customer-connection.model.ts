import { Field, ObjectType } from '@nestjs/graphql';
import { Customer } from './customer.model';

@ObjectType()
export class ProductCustomerConnection {
  @Field()
  id: string;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field()
  licenseStatus: string;

  @Field()
  userCount: number;

  @Field()
  activationKey: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  subscriptionType: string;

  @Field()
  customerId: string;

  @Field(() => Customer)
  customer: Customer;
}
