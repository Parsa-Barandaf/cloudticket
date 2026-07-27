import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TicketMessage {
  @Field()
  id: string;

  @Field()
  text: string;

  @Field()
  senderName: string;

  @Field()
  isInternal: boolean;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  authorId?: string;

  @Field({ nullable: true })
  authorType?: string;
}
