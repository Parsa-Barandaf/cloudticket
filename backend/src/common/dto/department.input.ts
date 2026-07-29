import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateDepartmentInput {
  @Field()
  name: string;

  @Field()
  lead: string;

  @Field({ nullable: true })
  icon?: string;

  @Field({ nullable: true })
  color?: string;

  @Field(() => [String], { defaultValue: [] })
  assignedProducts: string[];
}

@InputType()
export class UpdateDepartmentInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  lead?: string;

  @Field({ nullable: true })
  icon?: string;

  @Field({ nullable: true })
  color?: string;

  @Field(() => [String], { nullable: true })
  assignedProducts?: string[];
}
