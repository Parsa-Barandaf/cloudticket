import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { createReadStream, ReadStream } from 'fs';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PrismaService } from '../common/prisma.service';

export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface BackupSectionDefinition {
  key: string;
  tables: string[];
}

export interface BackupJobView {
  id: string;
  status: BackupStatus;
  progress: number;
  completedSteps: number;
  totalSteps: number;
  recordsProcessed: number;
  currentTable?: string;
  sections: string[];
  tables: string[];
  createdAt: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  fileName?: string;
  sizeBytes?: number;
  checksum?: string;
  createdBy: { id: string; name: string; email: string };
}

export interface BackupRecord extends BackupJobView {
  status: 'completed' | 'failed';
  counts: Record<string, number>;
}

interface RunningJob extends BackupJobView {
  counts: Record<string, number>;
}

/**
 * Logical backup groups. Every table of the database appears in exactly one
 * group, so selecting all groups produces a full database backup.
 */
export const BACKUP_SECTIONS: BackupSectionDefinition[] = [
  { key: 'users', tables: ['User', 'Department'] },
  {
    key: 'rbac',
    tables: [
      'Portal',
      'Permission',
      'Role',
      'RolePortal',
      'RolePermission',
      'UserRoleAssignment',
    ],
  },
  { key: 'customers', tables: ['Customer', 'ProductCustomerConnection'] },
  { key: 'products', tables: ['Product'] },
  { key: 'tickets', tables: ['Ticket', 'TicketMessage', 'TicketAttachment'] },
  { key: 'tasks', tables: ['Task', 'TaskComment'] },
  { key: 'activities', tables: ['Activity'] },
  { key: 'notifications', tables: ['Notification'] },
  { key: 'accessRequests', tables: ['AccessRequest'] },
];

const TABLE_DELEGATES: Record<string, string> = {
  Department: 'department',
  User: 'user',
  Customer: 'customer',
  Product: 'product',
  ProductCustomerConnection: 'productCustomerConnection',
  Ticket: 'ticket',
  TicketMessage: 'ticketMessage',
  TicketAttachment: 'ticketAttachment',
  Activity: 'activity',
  Notification: 'notification',
  Task: 'task',
  TaskComment: 'taskComment',
  AccessRequest: 'accessRequest',
  Portal: 'portal',
  Permission: 'permission',
  Role: 'role',
  RolePortal: 'rolePortal',
  RolePermission: 'rolePermission',
  UserRoleAssignment: 'userRoleAssignment',
};

function jsonReplacer(_key: string, value: unknown) {
  // Prisma exposes BigInt columns (e.g. TicketAttachment.sizeBytes). JSON has
  // no BigInt type, so store them as strings to keep the file valid.
  return typeof value === 'bigint' ? value.toString() : value;
}

function nowIso() {
  return new Date().toISOString();
}

export interface BackupRequestUser {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class BackupsService {
  private readonly backupDir =
    process.env.BACKUP_DIR || join(process.cwd(), 'backups');
  private readonly jobs = new Map<string, RunningJob>();

  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<BackupRecord[]> {
    await this.ensureDir();

    const files = await fs.readdir(this.backupDir);
    const metaFiles = files.filter((file) => file.endsWith('.meta.json'));

    const records = await Promise.all(
      metaFiles.map(async (file) => {
        try {
          const raw = await fs.readFile(join(this.backupDir, file), 'utf8');
          const record = JSON.parse(raw) as BackupRecord;
          if (!record?.id) return null;
          return record;
        } catch {
          return null;
        }
      }),
    );

    return records
      .filter((record): record is BackupRecord => Boolean(record))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }

  async start(
    sections: string[],
    user: BackupRequestUser,
  ): Promise<BackupJobView> {
    await this.ensureDir();

    const normalized = Array.isArray(sections)
      ? Array.from(
          new Set(
            sections.filter(
              (section): section is string => typeof section === 'string',
            ),
          ),
        )
      : [];

    if (normalized.length === 0) {
      throw new BadRequestException(
        'حداقل یک بخش برای پشتیبان‌گیری انتخاب کنید.',
      );
    }

    const knownSections = new Set(
      BACKUP_SECTIONS.map((section) => section.key),
    );
    if (normalized.some((section) => !knownSections.has(section))) {
      throw new BadRequestException(
        'بخش انتخاب‌شده برای پشتیبان‌گیری معتبر نیست.',
      );
    }

    const tables = this.resolveTables(normalized);
    if (tables.length === 0) {
      throw new BadRequestException('داده‌ای برای پشتیبان‌گیری یافت نشد.');
    }

    const createdAt = nowIso();
    const id = `bkp_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;
    const job: RunningJob = {
      id,
      status: 'pending',
      progress: 0,
      completedSteps: 0,
      totalSteps: tables.length + 1,
      recordsProcessed: 0,
      sections: normalized,
      tables,
      counts: {},
      createdAt,
      createdBy: {
        id: user?.id ?? '',
        name: user?.name ?? '',
        email: user?.email ?? '',
      },
    };

    this.jobs.set(id, job);

    // Run in the background so the HTTP request returns immediately and the
    // client can poll the progress endpoint.
    void this.runJob(job);

    return this.toView(job);
  }

  async getJob(id: string): Promise<BackupJobView> {
    this.assertSafeId(id);

    const running = this.jobs.get(id);
    if (running) return this.toView(running);

    const record = await this.readRecord(id);
    if (!record) {
      throw new NotFoundException('فرایند پشتیبان‌گیری یافت نشد.');
    }
    return this.toView(record);
  }

  async openDownload(
    id: string,
  ): Promise<{ record: BackupRecord; stream: ReadStream }> {
    await this.ensureDir();
    this.assertSafeId(id);

    const record = await this.readRecord(id);
    if (!record) {
      throw new NotFoundException('فایل پشتیبان یافت نشد.');
    }
    if (record.status !== 'completed') {
      throw new BadRequestException('این پشتیبان با موفقیت تکمیل نشده است.');
    }

    const filePath = this.dataPath(id);
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundException('فایل پشتیبان روی سرور موجود نیست.');
    }

    return { record, stream: createReadStream(filePath) };
  }

  async remove(id: string, confirmed: boolean) {
    if (!confirmed) {
      throw new BadRequestException(
        'برای حذف فایل پشتیبان، تأیید صریح لازم است.',
      );
    }

    await this.ensureDir();
    this.assertSafeId(id);

    const running = this.jobs.get(id);
    if (
      running &&
      (running.status === 'pending' || running.status === 'running')
    ) {
      throw new BadRequestException(
        'این پشتیبان در حال تهیه است و قابل حذف نیست.',
      );
    }

    const record = await this.readRecord(id);
    if (!record) {
      throw new NotFoundException('فایل پشتیبان یافت نشد.');
    }

    await fs.rm(this.dataPath(id), { force: true });
    await fs.rm(this.metaPath(id), { force: true });
    this.jobs.delete(id);

    return { success: true, id };
  }

  private async runJob(job: RunningJob) {
    job.status = 'running';

    const payload: {
      format: string;
      version: number;
      createdAt: string;
      generatedBy: { id: string; name: string; email: string };
      sections: string[];
      tables: Record<string, unknown[]>;
      counts: Record<string, number>;
    } = {
      format: 'cmp-crm-backup',
      version: 1,
      createdAt: job.createdAt,
      generatedBy: job.createdBy,
      sections: job.sections,
      tables: {},
      counts: {},
    };

    try {
      for (const table of job.tables) {
        job.currentTable = table;

        const delegateName = TABLE_DELEGATES[table];
        const delegate = delegateName
          ? (
              this.prisma as unknown as Record<
                string,
                { findMany: () => Promise<unknown[]> }
              >
            )[delegateName]
          : undefined;

        if (!delegate || typeof delegate.findMany !== 'function') {
          throw new Error(`دسترسی به جدول ${table} امکان‌پذیر نیست.`);
        }

        const rows = await delegate.findMany();
        payload.tables[table] = rows;
        payload.counts[table] = rows.length;
        job.counts = payload.counts;
        job.recordsProcessed += rows.length;
        job.completedSteps += 1;
        job.progress = this.progressFor(job);

        // Give the client a chance to render each step for small databases.
        await this.pause(120);
      }

      job.currentTable = '__write__';
      job.progress = this.progressFor(job);

      const json = JSON.stringify(payload, jsonReplacer, 2);
      const buffer = Buffer.from(json, 'utf8');
      const checksum = createHash('sha256').update(buffer).digest('hex');
      await fs.writeFile(this.dataPath(job.id), buffer);

      const completedAt = nowIso();
      const record: BackupRecord = {
        ...this.toView(job),
        status: 'completed',
        progress: 100,
        completedSteps: job.totalSteps,
        totalSteps: job.totalSteps,
        currentTable: undefined,
        completedAt,
        durationMs:
          new Date(completedAt).getTime() - new Date(job.createdAt).getTime(),
        fileName: `crm-backup-${completedAt.replace(/[:.]/g, '-')}.json`,
        sizeBytes: buffer.byteLength,
        checksum,
        counts: payload.counts,
      };

      await this.writeRecord(record);

      job.status = 'completed';
      job.progress = 100;
      job.completedSteps = job.totalSteps;
      job.completedAt = completedAt;
      job.durationMs = record.durationMs;
      job.fileName = record.fileName;
      job.sizeBytes = record.sizeBytes;
      job.checksum = checksum;
      job.currentTable = undefined;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'خطای نامشخص در تهیه پشتیبان';
      const completedAt = nowIso();

      job.status = 'failed';
      job.error = message;
      job.completedAt = completedAt;
      job.durationMs =
        new Date(completedAt).getTime() - new Date(job.createdAt).getTime();
      job.currentTable = undefined;

      const record: BackupRecord = {
        ...this.toView(job),
        status: 'failed',
        error: message,
        completedAt,
        counts: job.counts,
      };

      // Remove a partially written data file so no orphan backup remains.
      await fs
        .rm(this.dataPath(job.id), { force: true })
        .catch(() => undefined);

      // Best effort: a failed metadata file still lets the super admin see the
      // attempt in the history and delete it.
      await this.writeRecord(record).catch(() => undefined);
    }
  }

  private progressFor(job: RunningJob) {
    return Math.min(
      99,
      Math.round((job.completedSteps / Math.max(1, job.totalSteps)) * 100),
    );
  }

  private resolveTables(sections: string[]) {
    const selected = new Set(sections);
    const tables: string[] = [];

    for (const section of BACKUP_SECTIONS) {
      if (!selected.has(section.key)) continue;
      for (const table of section.tables) {
        if (!tables.includes(table)) tables.push(table);
      }
    }

    return tables;
  }

  private toView(job: RunningJob | BackupRecord): BackupJobView {
    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      completedSteps: job.completedSteps,
      totalSteps: job.totalSteps,
      recordsProcessed: job.recordsProcessed,
      currentTable: job.currentTable,
      sections: job.sections,
      tables: job.tables,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      durationMs: job.durationMs,
      error: job.error,
      fileName: job.fileName,
      sizeBytes: job.sizeBytes,
      checksum: job.checksum,
      createdBy: job.createdBy,
    };
  }

  private dataPath(id: string) {
    return join(this.backupDir, `${id}.json`);
  }

  private metaPath(id: string) {
    return join(this.backupDir, `${id}.meta.json`);
  }

  private async readRecord(id: string): Promise<BackupRecord | null> {
    try {
      const raw = await fs.readFile(this.metaPath(id), 'utf8');
      const record = JSON.parse(raw) as BackupRecord;
      return record?.id ? record : null;
    } catch {
      return null;
    }
  }

  private async writeRecord(record: BackupRecord) {
    await this.ensureDir();
    await fs.writeFile(
      this.metaPath(record.id),
      JSON.stringify(record, jsonReplacer, 2),
      'utf8',
    );
  }

  private async ensureDir() {
    await fs.mkdir(this.backupDir, { recursive: true });
  }

  private assertSafeId(id: string) {
    // Strict pattern both validates the generated id and blocks path traversal.
    if (!/^bkp_[a-z0-9]+_[a-f0-9]{8}$/.test(id)) {
      throw new NotFoundException('شناسه پشتیبان معتبر نیست.');
    }
  }

  private pause(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
