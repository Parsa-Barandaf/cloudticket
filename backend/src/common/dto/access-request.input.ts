import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class RequestAccessInput {
  @Field()
  name: string;

  @Field()
  companyName: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field({ nullable: true })
  industry?: string;
}

@InputType()
export class ApproveAccessRequestInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  industry?: string;
}

@InputType()
export class RejectAccessRequestInput {
  @Field()
  id: string;
}
