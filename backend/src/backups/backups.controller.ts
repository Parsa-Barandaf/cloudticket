import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { BackupsService, type BackupRequestUser } from './backups.service';
import { SuperAdminGuard } from './super-admin.guard';

interface AuthenticatedBackupRequest {
  user: BackupRequestUser;
}

@Controller('api/backups')
@UseGuards(AuthGuard('jwt'), SuperAdminGuard)
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Get()
  async list() {
    return this.backupsService.list();
  }

  @Post()
  async create(
    @Body() body: { sections?: string[] },
    @Req() request: AuthenticatedBackupRequest,
  ) {
    return this.backupsService.start(body?.sections ?? [], request.user);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { record, stream } = await this.backupsService.openDownload(id);

    response.set({
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${record.fileName}"`,
      'Content-Length': String(record.sizeBytes ?? 0),
      'Cache-Control': 'no-store',
    });

    return new StreamableFile(stream);
  }

  @Get(':id')
  async status(@Param('id') id: string) {
    return this.backupsService.getJob(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Query('confirm') confirm?: string) {
    return this.backupsService.remove(id, confirm === 'true');
  }
}
