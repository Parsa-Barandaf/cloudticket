import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { DepartmentsService } from './departments.service';
import { CustomRolesService } from './custom-roles.service';

@Module({
  providers: [UsersService, UsersResolver, DepartmentsService, CustomRolesService],
  exports: [UsersService],
})
export class UsersModule {}
