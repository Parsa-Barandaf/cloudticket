import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateConnectionInput {
  @Field()
  productId: string;

  @Field()
  customerId: string;

  @Field()
  startDate: string;

  @Field()
  endDate: string;

  @Field()
  activationKey: string;

  @Field()
  subscriptionType: string;

  @Field({ nullable: true })
  licenseStatus?: string;

  @Field()
  userCount: number;

  @Field({ nullable: true })
  notes?: string;
}

@InputType()
export class UpdateConnectionInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  startDate?: string;

  @Field({ nullable: true })
  endDate?: string;

  @Field({ nullable: true })
  licenseStatus?: string;

  @Field({ nullable: true })
  userCount?: number;

  @Field({ nullable: true })
  subscriptionType?: string;

  @Field({ nullable: true })
  activationKey?: string;

  @Field({ nullable: true })
  notes?: string;
}
