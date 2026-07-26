import { Field, InputType } from '@nestjs/graphql';
import { CustomerTier, CustomerStatus } from '../models/customer.model';

@InputType()
export class CreateCustomerInput {
  @Field()
  industry: string;

  @Field({ nullable: true })
  commercialName?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  website?: string;

  @Field({ nullable: true })
  address?: string;

  @Field(() => CustomerTier, { nullable: true })
  tier?: CustomerTier;

  @Field(() => CustomerStatus, { nullable: true })
  status?: CustomerStatus;

  @Field()
  userId: string;
}

@InputType()
export class UpdateCustomerInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  commercialName?: string;

  @Field({ nullable: true })
  industry?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  website?: string;

  @Field({ nullable: true })
  address?: string;

  @Field(() => CustomerTier, { nullable: true })
  tier?: CustomerTier;

  @Field(() => CustomerStatus, { nullable: true })
  status?: CustomerStatus;
}
