import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { CustomersService } from './customers.service';
import { CustomersResolver } from './customers.resolver';

@Module({
  imports: [ActivitiesModule],
  providers: [CustomersService, CustomersResolver],
})
export class CustomersModule {}
