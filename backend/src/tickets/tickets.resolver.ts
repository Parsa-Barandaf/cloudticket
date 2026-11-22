import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TicketsService } from './tickets.service';
import { Ticket } from '../common/models/ticket.model';
import { TicketMessage } from '../common/models/ticket-message.model';
import {
  CreateTicketInput,
  UpdateTicketStatusInput,
  UpdateTicketInput,
  CreateTicketMessageInput,
  DeleteTicketsInput,
} from '../common/dto/ticket.input';

@Resolver(() => Ticket)
export class TicketsResolver {
  constructor(private ticketsService: TicketsService) {}

  @Query(() => [Ticket])
  async tickets() {
    return this.ticketsService.findAll();
  }

  @Query(() => Ticket, { nullable: true })
  async ticket(@Args('id') id: string) {
    return this.ticketsService.findById(id);
  }

  @Mutation(() => Ticket)
  async createTicket(@Args('input') input: CreateTicketInput) {
    return this.ticketsService.create(input);
  }

  @Mutation(() => Ticket)
  async updateTicketStatus(@Args('input') input: UpdateTicketStatusInput) {
    return this.ticketsService.updateStatus(input.id, input.status as any);
  }

  @Mutation(() => Ticket)
  async updateTicket(@Args('input') input: UpdateTicketInput) {
    return this.ticketsService.update(input);
  }

  @Mutation(() => TicketMessage)
  async createTicketMessage(@Args('input') input: CreateTicketMessageInput) {
    return this.ticketsService.createMessage(input);
  }

  @Mutation(() => TicketMessage)
  async updateTicketMessage(
    @Args('id') id: string,
    @Args('text') text: string,
  ) {
    return this.ticketsService.updateMessage(id, text);
  }

  @Mutation(() => Boolean)
  async deleteTicketMessage(@Args('id') id: string) {
    return this.ticketsService.deleteMessage(id);
  }

  @Mutation(() => Boolean)
  async deleteTicket(@Args('id') id: string) {
    return this.ticketsService.delete(id);
  }

  @Mutation(() => Boolean)
  async deleteTickets(@Args('input') input: DeleteTicketsInput) {
    return this.ticketsService.deleteMany(input.ids);
  }
}
