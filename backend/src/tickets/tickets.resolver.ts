import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TicketsService } from './tickets.service';
import { Ticket } from '../common/models/ticket.model';
import { CreateTicketInput, UpdateTicketStatusInput } from '../common/dto/ticket.input';

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
}
