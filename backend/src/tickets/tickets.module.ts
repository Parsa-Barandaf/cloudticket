import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { TicketsService } from './tickets.service';
import { TicketsResolver } from './tickets.resolver';

@Module({
  imports: [ActivitiesModule],
  providers: [TicketsService, TicketsResolver],
})
export class TicketsModule {}
