import { getAuthItem } from './storage';

/**
 * The GraphQL client is configured with VITE_API_URL (usually "/graphql" in
 * production). The backup API lives on the same backend under /api/backups,
 * so derive the server root from that value.
 */
function apiRoot(): string {
  const configured = import.meta.env.VITE_API_URL || '';
  if (!configured) return 'http://localhost:4000';
  return configured.replace(/\/graphql\/?$/, '');
}

export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface BackupJob {
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

export interface BackupRecord extends BackupJob {
  status: 'completed' | 'failed';
  counts: Record<string, number>;
}

function authHeaders(): Record<string, string> {
  const token = getAuthItem('cmp_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${apiRoot()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let message = 'خطا در ارتباط با سرور';
    try {
      const payload = await response.json();
      message = payload?.message || message;
      if (Array.isArray(message)) message = message[0];
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function listBackups(): Promise<BackupRecord[]> {
  return request<BackupRecord[]>('/api/backups');
}

export function createBackup(sections: string[]): Promise<BackupJob> {
  return request<BackupJob>('/api/backups', {
    method: 'POST',
    body: { sections },
  });
}

export function getBackupJob(id: string): Promise<BackupJob> {
  return request<BackupJob>(`/api/backups/${encodeURIComponent(id)}`);
}

export function deleteBackup(id: string): Promise<{ success: boolean; id: string }> {
  return request<{ success: boolean; id: string }>(
    `/api/backups/${encodeURIComponent(id)}?confirm=true`,
    { method: 'DELETE' },
  );
}

export async function downloadBackup(
  record: Pick<BackupRecord, 'id' | 'fileName'>,
): Promise<void> {
  const response = await fetch(
    `${apiRoot()}/api/backups/${encodeURIComponent(record.id)}/download`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    let message = 'دانلود فایل پشتیبان ناموفق بود.';
    try {
      const payload = await response.json();
      message = payload?.message || message;
      if (Array.isArray(message)) message = message[0];
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = record.fileName || `${record.id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
