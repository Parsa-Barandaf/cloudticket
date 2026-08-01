import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateRoleInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true, defaultValue: 'internal' })
  scope?: string;

  @Field(() => [String], { nullable: true })
  portalIds?: string[];

  @Field(() => [String], { nullable: true })
  permissionIds?: string[];
}

@InputType()
export class UpdateRoleInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [String], { nullable: true })
  portalIds?: string[];

  @Field(() => [String], { nullable: true })
  permissionIds?: string[];
}

@InputType()
export class AssignRoleInput {
  @Field()
  userId: string;

  @Field()
  roleId: string;
}

@InputType()
export class UnassignRoleInput {
  @Field()
  userId: string;

  @Field()
  roleId: string;
}
