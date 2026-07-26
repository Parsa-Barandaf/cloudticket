import { Module } from '@nestjs/common';
import { AccessRequestsService } from './access-requests.service';
import { AccessRequestsResolver } from './access-requests.resolver';

@Module({
  providers: [AccessRequestsService, AccessRequestsResolver],
})
export class AccessRequestsModule {}
