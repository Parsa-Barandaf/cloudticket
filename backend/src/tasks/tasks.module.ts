import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TasksService } from './tasks.service';
import { TasksResolver } from './tasks.resolver';

@Module({
  imports: [ActivitiesModule, NotificationsModule],
  providers: [TasksService, TasksResolver],
  exports: [TasksService],
})
export class TasksModule {}
