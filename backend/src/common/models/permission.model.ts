import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Permission {
  @Field()
  id: string;

  @Field()
  key: string;

  @Field()
  module: string;

  @Field()
  portalId: string;

  @Field()
  createdAt: Date;
}
