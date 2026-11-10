/**
 * Data backend behind the embedded workspace service (the desktop's BFF).
 *
 * - `createSimulatedBackend`: in-memory records + Deno KV, simulated workers.
 * - `realstack/backend.ts`: the real NetScript graph (users service on SQLite,
 *   workers/sagas/triggers on Garnet, durable streams), same interface.
 *
 * The service, the UI and both renderers are identical across backends.
 */
import type { KvStore } from '@netscript/kv';
import {
  type ActivityEntry,
  type Job,
  type Overview,
  RECORD_STATUSES,
  type RecordPage,
  type RecordStatus,
  STATUS_LABEL,
  type WorkspaceRecord,
} from '../contract.ts';
import { WorkspaceStore } from './store.ts';

/** Where a backend publishes live changes (the service relays them on its stream). */
export interface LiveSink {
  activity(entry: ActivityEntry): void;
  job(job: Job): void;
}

export interface WorkspaceBackend {
  readonly kind: 'simulated' | 'realstack';
  overview(periodDays: number): Promise<Overview>;
  page(page: number, pageSize: number, query?: string, status?: RecordStatus): Promise<RecordPage>;
  get(id: string): Promise<WorkspaceRecord | undefined>;
  setStatus(id: string, status: RecordStatus, actor: string): Promise<WorkspaceRecord | undefined>;
  create(input: { ownerName: string; amount: number; currency: string }, actor: string): Promise<WorkspaceRecord>;
  jobs(): Promise<Job[]>;
  /** Begin live changes; `rate` drives the background load (events per second). */
  start(sink: LiveSink, rate: number): void;
  setRate(rate: number): void;
  stop(): Promise<void>;
}

export function activityEntry(actor: string, verb: string, label: string, recordId?: string): ActivityEntry {
  return { id: crypto.randomUUID(), actor, verb, label, recordId, timestamp: new Date().toISOString() };
}

export interface SimulatedBackend extends WorkspaceBackend {
  readonly store: WorkspaceStore;
}

export async function createSimulatedBackend(kv: KvStore): Promise<SimulatedBackend> {
  const store = new WorkspaceStore(kv);
  await store.load();
  let sink: LiveSink | undefined;
  let rate = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let tickCount = 0;
  const actors = ['Grace Hopper', 'Alan Turing', 'Radia Perlman', 'Barbara Liskov'];

  const tick = async () => {
    tickCount++;
    const jobs = [...store.jobs.values()];
    const job = jobs[tickCount % jobs.length];
    const progress = job.state === 'completed' ? 0 : Math.min(100, job.progress + 7);
    const next: Job = { ...job, progress, state: progress >= 100 ? 'completed' : 'running', updatedAt: new Date().toISOString() };
    store.jobs.set(job.id, next);
    sink?.job(next);
    if (tickCount % 3 === 0) {
      const record = store.page(1 + (tickCount % 20), 1).rows[0];
      if (record) {
        const status: RecordStatus = RECORD_STATUSES[(RECORD_STATUSES.indexOf(record.status) + 1) % RECORD_STATUSES.length];
        const updated = await store.upsert({ ...record, status, updatedAt: new Date().toISOString() });
        sink?.activity(activityEntry(actors[tickCount % actors.length], `moved to ${STATUS_LABEL[status].toLowerCase()}`, updated.reference, updated.id));
      }
    }
  };
  const schedule = () => {
    if (timer) clearInterval(timer);
    timer = rate > 0 ? setInterval(() => void tick(), Math.max(10, 1000 / rate)) : undefined;
  };

  return {
    kind: 'simulated',
    store,
    overview: (periodDays) => Promise.resolve(store.overview(periodDays)),
    page: (page, pageSize, query, status) => Promise.resolve(store.page(page, pageSize, query, status)),
    get: (id) => Promise.resolve(store.get(id)),
    async setStatus(id, status, actor) {
      const record = store.get(id);
      if (!record) return undefined;
      const updated = await store.upsert({ ...record, status, updatedAt: new Date().toISOString() });
      sink?.activity(activityEntry(actor, `marked ${STATUS_LABEL[status].toLowerCase()}`, updated.reference, updated.id));
      return updated;
    },
    async create(input, actor) {
      const now = new Date().toISOString();
      const created = await store.upsert({
        id: `rec_${crypto.randomUUID().slice(0, 8)}`,
        reference: `ORD-${store.size + 10_000}`,
        ownerName: input.ownerName,
        status: 'pending',
        amount: input.amount,
        currency: input.currency,
        createdAt: now,
        updatedAt: now,
      });
      sink?.activity(activityEntry(actor, 'created', created.reference, created.id));
      return created;
    },
    jobs: () => Promise.resolve([...store.jobs.values()]),
    start(next, initialRate) {
      sink = next;
      rate = initialRate;
      schedule();
    },
    setRate(next) {
      rate = next;
      schedule();
    },
    stop() {
      if (timer) clearInterval(timer);
      return Promise.resolve();
    },
  };
}
