import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateCustomRoleInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true, defaultValue: 'support' })
  portalType?: string;

  @Field(() => String, { defaultValue: '{}' })
  permissions: string;
}

@InputType()
export class UpdateCustomRoleInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  portalType?: string;

  @Field(() => String, { nullable: true })
  permissions?: string;
}

@InputType()
export class DeleteCustomRoleInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  reassignRoleId?: string;
}
