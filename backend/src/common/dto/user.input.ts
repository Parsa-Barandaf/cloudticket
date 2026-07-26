import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  company?: string;

  @Field({ nullable: true })
  departmentId?: string;

  @Field({ nullable: true })
  customRoleId?: string;

  @Field({ defaultValue: true })
  active: boolean;
}

@InputType()
export class UpdateUserInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  company?: string;

  @Field({ nullable: true })
  departmentId?: string;

  @Field({ nullable: true })
  customRoleId?: string;

  @Field({ nullable: true })
  active?: boolean;
}
