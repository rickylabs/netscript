/**
 * Real-stack backend for the desktop BFF: every read and write goes through
 * typed NetScript SDK clients to the supervised graph.
 *
 * | Desktop concept | Real NetScript surface                                              |
 * | --------------- | ------------------------------------------------------------------- |
 * | Records         | `users` service (generated CRUD contract, Prisma + SQLite)          |
 * | Overview        | BFF aggregation over `users.list` pages (as a Fresh loader would)   |
 * | Activity        | Durable Streams topic `/scaffold/users/records` (long-poll follow)  |
 * | Jobs            | `workers-api` (`listJobs`, `listExecutions` polled; see pollWorkers) |
 * | Load            | `users.update` + `workers.triggerJob` (queue on Garnet, worker run) |
 *
 * @module
 */
import { activityEntry, type LiveSink, type WorkspaceBackend } from '../app/service/backend.ts';
import { computeOverview } from '../app/service/store.ts';
import { type Job, type Overview, RECORD_STATUSES, type RecordStatus, type WorkspaceRecord } from '../app/contract.ts';
import { ACTIVITY_STREAM_PATH, createStackClients, type StackClients, streamUrl } from './clients.ts';

type UserRow = Awaited<ReturnType<StackClients['users']['getById']>>;
type JobDef = Awaited<ReturnType<StackClients['workers']['listJobs']>>['jobs'][number];
type Execution = Awaited<ReturnType<StackClients['workers']['listExecutions']>>['executions'][number];

const PAGE = 100;

function toRecord(row: UserRow): WorkspaceRecord {
  return {
    id: String(row.id),
    reference: row.reference,
    ownerName: row.ownerName,
    status: row.status as RecordStatus,
    // The scaffold stores signed integer minor units.
    amount: row.amount / 100,
    currency: row.currency,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function toJob(job: JobDef, latest: Execution | undefined): Job {
  const status = latest?.status;
  const state: Job['state'] = status === 'running'
    ? 'running'
    : status === 'completed'
    ? 'completed'
    : status === 'failed' || status === 'timeout' || status === 'cancelled'
    ? 'failed'
    : 'queued';
  return {
    id: job.id,
    label: job.name,
    state,
    progress: latest?.progressPercent ?? (state === 'completed' ? 100 : 0),
    detail: latest?.progressMessage ?? latest?.error ?? `${job.executionType} · ${job.topic}`,
    updatedAt: latest?.completedAt ?? latest?.startedAt ?? latest?.triggeredAt ?? new Date(0).toISOString(),
  };
}

interface ActivityValue {
  id: string;
  actor: { name: string };
  verb: string;
  recordId: string;
  reference: string;
  timestamp: string;
}

export interface RealStackBackendOptions {
  readonly clients?: StackClients;
  /** Max concurrent load-generator requests (backpressure). */
  readonly maxInFlight?: number;
}

export function createRealStackBackend(options: RealStackBackendOptions = {}): WorkspaceBackend & { stats(): Record<string, number> } {
  const c = options.clients ?? createStackClients();
  const maxInFlight = options.maxInFlight ?? 8;
  const abort = new AbortController();
  let sink: LiveSink | undefined;
  let rate = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let tick = 0;
  let inFlight = 0;
  const stats = { loadSent: 0, loadDropped: 0, loadFailed: 0, activityEvents: 0, workerEvents: 0, overviewReads: 0 };
  let recordIds: number[] = [];
  let jobIds: string[] = [];
  const jobDefs = new Map<string, JobDef>();

  // ---- reads ---------------------------------------------------------------
  async function allRecords(): Promise<WorkspaceRecord[]> {
    const first = await c.users.list({ page: 1, limit: PAGE, sortBy: 'updatedAt', sortOrder: 'desc' });
    const pages = Math.ceil(first.pagination.total / PAGE);
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
        c.users.list({ page: index + 2, limit: PAGE, sortBy: 'updatedAt', sortOrder: 'desc' })),
    );
    const rows = [first, ...rest].flatMap((page) => page.data.map(toRecord));
    recordIds = rows.map((row) => Number(row.id));
    return rows;
  }

  let overviewCache: { at: number; periodDays: number; value: Promise<Overview> } | undefined;
  function overview(periodDays: number): Promise<Overview> {
    // Coalesce concurrent refreshes (several renderers, throttled stream refetch).
    if (overviewCache && overviewCache.periodDays === periodDays && performance.now() - overviewCache.at < 250) return overviewCache.value;
    stats.overviewReads++;
    const value = allRecords().then((rows) => computeOverview(rows, periodDays, Date.now()));
    overviewCache = { at: performance.now(), periodDays, value };
    value.catch(() => overviewCache = undefined);
    return value;
  }

  async function jobs(): Promise<Job[]> {
    const [list, history] = await Promise.all([
      c.workers.listJobs({ limit: 20, offset: 0 }),
      c.workers.listExecutions({ limit: 100, offset: 0 }),
    ]);
    jobIds = list.jobs.filter((job) => job.enabled).map((job) => job.id);
    for (const job of list.jobs) jobDefs.set(job.id, job);
    return list.jobs.map((job) =>
      toJob(job, history.executions.filter((execution) => execution.jobId === job.id).sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))[0])
    );
  }

  // ---- live: durable stream follow ----------------------------------------
  async function followActivity(): Promise<void> {
    let offset = '-1';
    let first = true;
    while (!abort.signal.aborted) {
      try {
        const url = new URL(streamUrl(ACTIVITY_STREAM_PATH));
        url.searchParams.set('offset', offset);
        if (!first) url.searchParams.set('live', 'long-poll');
        const response = await fetch(url, { signal: abort.signal });
        if (response.status === 404) {
          // The topic is created by the first committed record write.
          await response.body?.cancel();
          await new Promise((r) => setTimeout(r, 500));
          continue;
        }
        if (!response.ok && response.status !== 204) {
          await response.body?.cancel();
          await new Promise((r) => setTimeout(r, 1_000));
          continue;
        }
        const next = response.headers.get('Stream-Next-Offset');
        const text = response.status === 204 ? '' : await response.text();
        if (text.trim()) {
          const events = JSON.parse(text) as Array<{ type: string; value?: ActivityValue }>;
          const fresh = first ? events.slice(-20) : events;
          for (const event of fresh) {
            if (event.type !== 'record-activity' || !event.value) continue;
            const value = event.value;
            stats.activityEvents++;
            sink?.activity({ ...activityEntry(value.actor.name, value.verb, value.reference, value.recordId), id: value.id, timestamp: value.timestamp });
          }
        }
        if (next) offset = next;
        first = false;
      } catch (error) {
        if (abort.signal.aborted) return;
        console.error('activity follow failed', error);
        await new Promise((r) => setTimeout(r, 1_000));
      }
    }
  }

  // ---- live: workers executions ------------------------------------------
  // `workers.subscribe` (KV watch SSE) delivers only its initial snapshots when the KV is Garnet:
  // no `execution.*` events reach subscribers (observed with 0.0.9). Poll the execution history
  // instead: every second under load or while a job runs, every five seconds otherwise.
  const lastSeen = new Map<string, string>();
  async function pollWorkers(): Promise<void> {
    while (!abort.signal.aborted) {
      let busy = rate > 0;
      try {
        const history = await c.workers.listExecutions({ limit: 100, offset: 0 });
        const latest = new Map<string, Execution>();
        for (const execution of history.executions) {
          const current = latest.get(execution.jobId);
          if (!current || execution.triggeredAt > current.triggeredAt) latest.set(execution.jobId, execution);
        }
        for (const [jobId, execution] of latest) {
          const def = jobDefs.get(jobId);
          if (!def) continue;
          const fingerprint = `${execution.id}:${execution.status}:${execution.progressPercent ?? ''}`;
          if (execution.status === 'running' || execution.status === 'queued' || execution.status === 'pending') busy = true;
          if (lastSeen.get(jobId) === fingerprint) continue;
          lastSeen.set(jobId, fingerprint);
          stats.workerEvents++;
          sink?.job(toJob(def, execution));
        }
      } catch (error) {
        if (abort.signal.aborted) return;
        console.error('workers poll failed', error);
      }
      await new Promise((resolve) => setTimeout(resolve, busy ? 1_000 : 5_000));
    }
  }

  // ---- load generator -------------------------------------------------------
  function send(work: () => Promise<unknown>): void {
    if (inFlight >= maxInFlight) {
      stats.loadDropped++;
      return;
    }
    inFlight++;
    stats.loadSent++;
    work().catch(() => stats.loadFailed++).finally(() => inFlight--);
  }

  function loadTick(): void {
    tick++;
    if (jobIds.length) send(() => c.workers.triggerJob({ id: jobIds[tick % jobIds.length] }));
    if (tick % 3 === 0 && recordIds.length) {
      const id = recordIds[(tick * 7919) % recordIds.length];
      const status = RECORD_STATUSES[tick % RECORD_STATUSES.length];
      send(() => c.users.update({ id, data: { status } }));
    }
  }

  function schedule(): void {
    if (timer) clearInterval(timer);
    timer = rate > 0 ? setInterval(loadTick, Math.max(10, 1000 / rate)) : undefined;
  }

  return {
    kind: 'realstack',
    overview,
    async page(page, pageSize, query, status) {
      const filters = { sortBy: 'updatedAt' as const, sortOrder: 'desc' as const, ...(query ? { search: query } : {}), ...(status ? { status } : {}) };
      if (pageSize <= PAGE) {
        const result = await c.users.list({ page, limit: pageSize, ...filters });
        return { rows: result.data.map(toRecord), total: result.pagination.total, page, pageSize };
      }
      // Larger windows (the native virtual list asks for every match): fan out over service pages.
      const startPage = Math.floor(((page - 1) * pageSize) / PAGE) + 1;
      const first = await c.users.list({ page: startPage, limit: PAGE, ...filters });
      const wanted = Math.min(pageSize, Math.max(0, first.pagination.total - (startPage - 1) * PAGE));
      const more = Math.max(0, Math.ceil(wanted / PAGE) - 1);
      const rest = await Promise.all(Array.from({ length: more }, (_, index) => c.users.list({ page: startPage + 1 + index, limit: PAGE, ...filters })));
      const rows = [first, ...rest].flatMap((result) => result.data.map(toRecord)).slice(0, pageSize);
      return { rows, total: first.pagination.total, page, pageSize };
    },
    async get(id) {
      try {
        return toRecord(await c.users.getById({ id: Number(id) }));
      } catch {
        return undefined;
      }
    },
    async setStatus(id, status) {
      // The users service publishes the record activity; the stream follower relays it.
      return toRecord(await c.users.update({ id: Number(id), data: { status } }));
    },
    async create(input) {
      const created = await c.users.create({
        name: `Order for ${input.ownerName}`,
        ownerName: input.ownerName,
        ownerEmail: `${input.ownerName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@example.com`,
        status: 'pending',
        amount: Math.round(input.amount * 100),
        currency: input.currency,
      });
      recordIds.push(created.id);
      return toRecord(created);
    },
    jobs,
    start(next, initialRate) {
      sink = next;
      rate = initialRate;
      // Prime ids for the load generator, then follow both live sources.
      void Promise.all([jobs(), allRecords()]).catch((error) => console.error('real-stack prime failed', error)).finally(schedule);
      void followActivity();
      void pollWorkers();
    },
    setRate(next) {
      rate = next;
      schedule();
    },
    stop() {
      if (timer) clearInterval(timer);
      abort.abort();
      return Promise.resolve();
    },
    stats: () => ({ ...stats, inFlight }),
  };
}
