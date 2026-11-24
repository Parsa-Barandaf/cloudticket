import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { NotificationsService } from './notifications.service';
import { Notification } from '../common/models/notification.model';
import {
  CreateNotificationInput,
  DeleteNotificationsInput,
} from '../common/dto/notification.input';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private notificationsService: NotificationsService) {}

  @Query(() => [Notification])
  async notifications(
    @Args('limit', { nullable: true }) limit?: number,
    @Args('includeArchived', { nullable: true, defaultValue: false })
    includeArchived?: boolean,
  ) {
    return this.notificationsService.findAll(limit, includeArchived);
  }

  @Mutation(() => Notification)
  async createNotification(@Args('input') input: CreateNotificationInput) {
    return this.notificationsService.create(input);
  }

  @Mutation(() => Notification)
  async markNotificationRead(@Args('id') id: string) {
    return this.notificationsService.markRead(id);
  }

  @Mutation(() => Boolean)
  async markAllNotificationsRead() {
    return this.notificationsService.markAllRead();
  }

  @Mutation(() => Notification, { nullable: true })
  async toggleNotificationArchive(@Args('id') id: string) {
    return this.notificationsService.toggleArchive(id);
  }

  @Mutation(() => Boolean)
  async deleteNotification(@Args('id') id: string) {
    return this.notificationsService.delete(id);
  }

  @Mutation(() => Boolean)
  async deleteNotifications(@Args('input') input: DeleteNotificationsInput) {
    return this.notificationsService.deleteMany(input.ids);
  }
}
