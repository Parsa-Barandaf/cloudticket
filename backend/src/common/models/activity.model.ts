import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Activity {
  @Field()
  id: string;

  @Field()
  type: string;

  @Field()
  title: string;

  @Field()
  subtitle: string;

  @Field()
  createdAt: Date;
}
