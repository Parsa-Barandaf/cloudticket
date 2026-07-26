import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Department {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  lead: string;

  @Field(() => [String])
  assignedProducts: string[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
