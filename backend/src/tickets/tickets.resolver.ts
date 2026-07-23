import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TicketsService } from './tickets.service';

@Resolver()
export class TicketsResolver {
  constructor(private ticketsService: TicketsService) {}

  @Query(() => String)
  async tickets() {
    return 'tickets placeholder';
  }

  @Mutation(() => String)
  async createTicket(
    @Args('title') title: string,
    @Args('priority') priority: string,
    @Args('customerId') customerId: string,
  ) {
    return 'ticket created';
  }
}
