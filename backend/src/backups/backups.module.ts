import { Module } from '@nestjs/common';
import { BackupsController } from './backups.controller';
import { BackupsService } from './backups.service';
import { SuperAdminGuard } from './super-admin.guard';

@Module({
  controllers: [BackupsController],
  providers: [BackupsService, SuperAdminGuard],
})
export class BackupsModule {}
