import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { DepartmentsService } from './departments.service';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [ActivitiesModule],
  providers: [UsersService, UsersResolver, DepartmentsService],
  exports: [UsersService],
})
export class UsersModule {}
