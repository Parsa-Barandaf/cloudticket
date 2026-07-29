import { Module } from '@nestjs/common';
import { AccessRequestsService } from './access-requests.service';
import { AccessRequestsResolver } from './access-requests.resolver';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [ActivitiesModule],
  providers: [AccessRequestsService, AccessRequestsResolver],
})
export class AccessRequestsModule {}
