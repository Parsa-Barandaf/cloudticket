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
