import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Portal {
  @Field()
  id: string;

  @Field()
  key: string;

  @Field()
  name: string;

  @Field()
  createdAt: Date;
}
