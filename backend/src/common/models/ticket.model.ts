import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from './user.model';
import { Customer } from './customer.model';
import { Product } from './product.model';
import { TicketMessage } from './ticket-message.model';

export enum TicketPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  AWAITING_CUSTOMER = 'AWAITING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

registerEnumType(TicketPriority, { name: 'TicketPriority' });
registerEnumType(TicketStatus, { name: 'TicketStatus' });

@ObjectType()
export class Ticket {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field(() => TicketPriority)
  priority: TicketPriority;

  @Field(() => TicketStatus)
  status: TicketStatus;

  @Field()
  date: Date;

  @Field()
  customerId: string;

  @Field(() => Customer)
  customer: Customer;

  @Field({ nullable: true })
  productId?: string;

  @Field(() => Product, { nullable: true })
  product?: Product;

  @Field({ nullable: true })
  assignedToId?: string;

  @Field(() => User, { nullable: true })
  assignedTo?: User;

  @Field(() => [TicketMessage])
  messages: TicketMessage[];
}
