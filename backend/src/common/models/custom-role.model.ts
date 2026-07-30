import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CustomRole {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  portalType: string;

  @Field(() => String)
  permissions: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
