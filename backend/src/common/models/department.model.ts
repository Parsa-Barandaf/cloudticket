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

  @Field({ defaultValue: 'Users2' })
  icon: string;

  @Field({ defaultValue: 'indigo' })
  color: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
