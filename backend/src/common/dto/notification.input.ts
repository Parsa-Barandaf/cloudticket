import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateNotificationInput {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  type: string;

  @Field({ defaultValue: 'normal' })
  priority: string;

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
}

@InputType()
export class DeleteNotificationsInput {
  @Field(() => [String])
  ids: string[];
}
