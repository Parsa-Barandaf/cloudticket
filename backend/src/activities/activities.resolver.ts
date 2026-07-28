import { Args, Query, Resolver } from '@nestjs/graphql';
import { ActivitiesService } from './activities.service';
import { Activity } from '../common/models/activity.model';

@Resolver(() => Activity)
export class ActivitiesResolver {
  constructor(private activitiesService: ActivitiesService) {}

  @Query(() => [Activity])
  async activities(@Args('limit', { nullable: true }) limit?: number) {
    return this.activitiesService.findAll(limit);
  }
}
