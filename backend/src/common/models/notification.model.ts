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
  priority: string;

  @Field()
  read: boolean;

  @Field()
  archived: boolean;

  @Field({ nullable: true })
  authorName?: string;

  @Field({ nullable: true })
  authorAvatarBg?: string;

  @Field({ nullable: true })
  detailedContent?: string;

  @Field({ nullable: true })
  linkedType?: string;

  @Field({ nullable: true })
  linkedId?: string;

  @Field({ nullable: true })
  linkedName?: string;

  @Field()
  createdAt: Date;
}
