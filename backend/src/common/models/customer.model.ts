import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from './user.model';
import { Ticket } from './ticket.model';
import { ProductCustomerConnection } from './product-customer-connection.model';

export enum CustomerTier {
  GOLD = 'GOLD',
  SILVER = 'SILVER',
  BRONZE = 'BRONZE',
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

registerEnumType(CustomerTier, { name: 'CustomerTier' });
registerEnumType(CustomerStatus, { name: 'CustomerStatus' });

@ObjectType()
export class Customer {
  @Field()
  id: string;

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

  @Field(() => CustomerTier)
  tier: CustomerTier;

  @Field(() => CustomerStatus)
  status: CustomerStatus;

  @Field()
  usersCount: number;

  @Field()
  activeProductsCount: number;

  @Field({ nullable: true })
  partnershipStartDate?: Date;

  @Field({ nullable: true })
  lastActivity?: Date;

  @Field()
  userId: string;

  @Field(() => User)
  user: User;

  @Field(() => [Ticket])
  tickets: Ticket[];

  @Field(() => [ProductCustomerConnection])
  connections: ProductCustomerConnection[];
}
