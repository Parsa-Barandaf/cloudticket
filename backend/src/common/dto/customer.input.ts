import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateCustomerInput {
  @Field()
  industry: string;

  @Field({ nullable: true })
  commercialName?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  tier?: string;

  @Field()
  userId: string;
}
