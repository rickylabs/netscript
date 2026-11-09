/**
 * Application state as Preact signals. Renderer-agnostic: identical in the
 * GPUIX and webview builds. Live stream changes patch state directly (no
 * refetch for activity/jobs; throttled refetch for aggregates).
 */
import { batch, computed, signal } from '@preact/signals';
import type { ActivityEntry, Job, Overview, RecordPage, RecordStatus, Session, WorkspaceRecord } from '../contract.ts';
import { host } from './host.ts';
import { type ActivitySubscription, createWorkspaceClient, followActivity, type StreamChange, type WorkspaceClient } from './workspace-client.ts';
import { scheme, type Scheme } from '../ui/theme.ts';

export const session = signal<Session | null | undefined>(undefined);
export const overview = signal<Overview | null>(null);
export const jobs = signal<Job[]>([]);
export const activity = signal<ActivityEntry[]>([]);
export const streamState = signal<'idle' | 'connecting' | 'live' | 'reconnecting'>('idle');
export const streamEvents = signal(0);
export const lastError = signal<string | null>(null);
export const busy = signal(false);

export const recordsQuery = signal('');
export const recordsStatus = signal<RecordStatus | undefined>(undefined);
export const recordsPage = signal(1);
export const records = signal<RecordPage | null>(null);
export const selectedRecord = signal<WorkspaceRecord | null>(null);
export const notificationsEnabled = signal(true);

export const toast = signal<string | null>(null);
let toastTimer: ReturnType<typeof setTimeout> | undefined;

/** In-app notification, used when the host has no OS notification API. */
export function showToast(message: string): void {
  toast.value = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.value = null, 4_000);
}

export const runningJobs = computed(() => jobs.value.filter((job) => job.state === 'running').length);

let client: WorkspaceClient | undefined;
let subscription: ActivitySubscription | undefined;

function api(): WorkspaceClient {
  client ??= createWorkspaceClient(host());
  return client;
}

function describe(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
}

export async function loadPreferences(): Promise<void> {
  const settings = host().settings;
  const [savedScheme, notify] = await Promise.all([
    settings.get<Scheme>('scheme'),
    settings.get<boolean>('notifications'),
  ]);
  batch(() => {
    if (savedScheme === 'light' || savedScheme === 'dark') scheme.value = savedScheme;
    if (typeof notify === 'boolean') notificationsEnabled.value = notify;
  });
}

export async function setScheme(next: Scheme): Promise<void> {
  scheme.value = next;
  await host().settings.set('scheme', next);
}

export async function setNotifications(enabled: boolean): Promise<void> {
  notificationsEnabled.value = enabled;
  await host().settings.set('notifications', enabled);
}

export async function refreshSession(): Promise<Session | null> {
  try {
    session.value = await api().session.me({});
  } catch (error) {
    lastError.value = describe(error);
    session.value = null;
  }
  return session.value ?? null;
}

export async function signIn(email: string, password: string): Promise<boolean> {
  busy.value = true;
  lastError.value = null;
  try {
    const response = await host().fetch(`${host().baseUrl}/auth/sign-in`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { error?: string };
      lastError.value = body.error ?? `Sign-in failed (HTTP ${response.status}).`;
      return false;
    }
    await refreshSession();
    return session.value != null;
  } catch (error) {
    lastError.value = describe(error);
    return false;
  } finally {
    busy.value = false;
  }
}

export async function signOut(): Promise<void> {
  await subscription?.close();
  subscription = undefined;
  await host().fetch(`${host().baseUrl}/auth/sign-out`, { method: 'POST' }).catch(() => {});
  batch(() => {
    session.value = null;
    overview.value = null;
    activity.value = [];
    jobs.value = [];
    streamState.value = 'idle';
  });
}

export async function loadWorkspace(): Promise<void> {
  const [nextOverview, nextJobs] = await Promise.all([api().overview.get({ periodDays: 28 }), api().jobs.list({})]);
  batch(() => {
    overview.value = nextOverview;
    jobs.value = nextJobs;
  });
}

export async function loadRecords(): Promise<void> {
  records.value = await api().records.list({
    page: recordsPage.value,
    pageSize: 50,
    query: recordsQuery.value || undefined,
    status: recordsStatus.value,
  });
}

export async function loadRecord(id: string): Promise<void> {
  selectedRecord.value = await api().records.get({ id });
}

export async function setRecordStatus(id: string, status: RecordStatus): Promise<void> {
  try {
    selectedRecord.value = await api().records.setStatus({ id, status });
  } catch (error) {
    lastError.value = describe(error);
  }
}

export async function createRecord(ownerName: string, amount: number): Promise<WorkspaceRecord | null> {
  try {
    return await api().records.create({ ownerName, amount, currency: 'CHF' });
  } catch (error) {
    lastError.value = describe(error);
    return null;
  }
}

// ---- live stream ---------------------------------------------------------------

let overviewTimer: ReturnType<typeof setTimeout> | undefined;
let recordsTimer: ReturnType<typeof setTimeout> | undefined;
let recordsVisible = false;

export function setRecordsVisible(visible: boolean): void {
  recordsVisible = visible;
}

function throttle(kind: 'overview' | 'records'): void {
  if (kind === 'overview' && !overviewTimer) {
    overviewTimer = setTimeout(() => {
      overviewTimer = undefined;
      void api().overview.get({ periodDays: 28 }).then((next) => overview.value = next).catch(() => {});
    }, 1_000);
  }
  if (kind === 'records' && recordsVisible && !recordsTimer) {
    recordsTimer = setTimeout(() => {
      recordsTimer = undefined;
      void loadRecords().catch(() => {});
    }, 1_000);
  }
}

function applyChanges(changes: readonly StreamChange[]): void {
  let nextActivity: ActivityEntry[] | undefined;
  let nextJobs: Job[] | undefined;
  for (const change of changes) {
    if (change.type === 'activity' && change.value) {
      nextActivity ??= activity.value.slice();
      nextActivity.unshift(change.value as ActivityEntry);
    } else if (change.type === 'job' && change.value) {
      const job = change.value as Job;
      nextJobs ??= jobs.value.slice();
      const index = nextJobs.findIndex((existing) => existing.id === job.id);
      if (index >= 0) nextJobs[index] = job;
      else nextJobs.push(job);
      if (job.state === 'completed' && job.progress >= 100 && notificationsEnabled.value) {
        host().native?.notify('Job completed', `${job.label} finished.`);
      }
    }
  }
  batch(() => {
    streamEvents.value += changes.length;
    if (nextActivity) activity.value = nextActivity.slice(0, 40);
    if (nextJobs) jobs.value = nextJobs;
  });
  if (nextActivity) {
    throttle('overview');
    throttle('records');
  }
}

export function connectActivity(): void {
  if (subscription) return;
  streamState.value = 'connecting';
  // Replay the last few entries, then follow live.
  subscription = followActivity(host(), {
    onChanges: applyChanges,
    onState: (state) => {
      if (streamState.value !== state) streamState.value = state;
    },
  });
}
