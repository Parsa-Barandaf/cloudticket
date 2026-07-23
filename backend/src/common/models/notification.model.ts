import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Notification {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  type: string;

  @Field()
  read: boolean;

  @Field()
  createdAt: Date;
}
