import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ProductCustomerConnection } from './product-customer-connection.model';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

registerEnumType(ProductStatus, { name: 'ProductStatus' });

@ObjectType()
export class Product {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  category: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  version: string;

  @Field(() => ProductStatus)
  status: ProductStatus;

  @Field()
  clientsCount: number;

  @Field({ nullable: true })
  logoColor?: string;

  @Field({ nullable: true })
  logoInitials?: string;

  @Field()
  createdAt: Date;

  @Field()
  lastUpdated: Date;

  @Field(() => [ProductCustomerConnection])
  connections: ProductCustomerConnection[];
}
