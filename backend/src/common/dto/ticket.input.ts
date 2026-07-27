import { Field, InputType } from '@nestjs/graphql';

import { TicketPriority } from '../models/ticket.model';

@InputType()
export class CreateTicketInput {
  @Field()
  title: string;

  @Field(() => TicketPriority)
  priority: TicketPriority;

  @Field()
  customerId: string;

  @Field({ nullable: true })
  productId?: string;

  @Field({ nullable: true })
  assignedToId?: string;
}

@InputType()
export class UpdateTicketStatusInput {
  @Field()
  id: string;

  @Field()
  status: string;
}

@InputType()
export class UpdateTicketInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  title?: string;

  @Field(() => TicketPriority, { nullable: true })
  priority?: TicketPriority;

  @Field(() => String, { nullable: true })
  status?: string;

  @Field({ nullable: true })
  assignedToId?: string;

  @Field({ nullable: true })
  productId?: string;
}

@InputType()
export class CreateTicketMessageInput {
  @Field()
  ticketId: string;

  @Field()
  text: string;

  @Field()
  senderName: string;

  @Field({ defaultValue: false })
  isInternal: boolean;

  @Field({ nullable: true })
  authorId?: string;

  @Field({ nullable: true })
  authorType?: string;
}

@InputType()
export class DeleteTicketsInput {
  @Field(() => [String])
  ids: string[];
}
