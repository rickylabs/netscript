/**
 * Workspace data for the embedded service: deterministic seed records held in
 * memory, with every mutation persisted through `@netscript/kv` so edits survive
 * restarts. Seeding is in-memory on purpose: cold start must not pay for a bulk
 * KV write.
 */
import type { KvStore } from '@netscript/kv';
import {
  type Job,
  type Metric,
  type Overview,
  RECORD_STATUSES,
  type RecordPage,
  type RecordStatus,
  type WorkspaceRecord,
} from '../contract.ts';

const OWNERS = [
  'Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Edsger Dijkstra',
  'Barbara Liskov', 'Donald Knuth', 'Margaret Hamilton', 'Ken Thompson', 'Radia Perlman',
  'Leslie Lamport', 'Frances Allen', 'John McCarthy', 'Hedy Lamarr', 'Niklaus Wirth',
];
const DAY = 86_400_000;

/** Small deterministic PRNG so every run (and every benchmark instance) sees the same data. */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedRecords(count: number, now: number): WorkspaceRecord[] {
  const random = mulberry32(42);
  const weights: Array<[RecordStatus, number]> = [
    ['paid', 0.38], ['shipped', 0.24], ['awaiting_payment', 0.16], ['draft', 0.1], ['refunded', 0.05], ['cancelled', 0.07],
  ];
  const records: WorkspaceRecord[] = [];
  for (let index = 0; index < count; index++) {
    const created = now - Math.floor(random() * 56 * DAY) - Math.floor(random() * DAY);
    let roll = random();
    let status: RecordStatus = 'paid';
    for (const [candidate, weight] of weights) {
      if ((roll -= weight) <= 0) {
        status = candidate;
        break;
      }
    }
    records.push({
      id: `rec_${(10_000 + index).toString(36)}`,
      reference: `ORD-${10_000 + index}`,
      ownerName: OWNERS[Math.floor(random() * OWNERS.length)],
      status,
      amount: Math.round((20 + random() * 1_800) * 100) / 100,
      currency: random() < 0.72 ? 'CHF' : 'EUR',
      createdAt: new Date(created).toISOString(),
      updatedAt: new Date(created + Math.floor(random() * 3 * DAY)).toISOString(),
    });
  }
  return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function metric(current: number, previous: number): Metric {
  return {
    current,
    previous,
    delta: current - previous,
    percentChange: previous === 0 ? null : ((current - previous) / previous) * 100,
  };
}

export class WorkspaceStore {
  readonly #kv: KvStore;
  #records: WorkspaceRecord[] = [];
  readonly #byId = new Map<string, WorkspaceRecord>();
  readonly jobs = new Map<string, Job>();

  constructor(kv: KvStore) {
    this.#kv = kv;
  }

  async load(seedCount = 1_200): Promise<void> {
    this.#records = seedRecords(seedCount, Date.now());
    for (const record of this.#records) this.#byId.set(record.id, record);
    for await (const entry of this.#kv.list<WorkspaceRecord>({ prefix: ['workspace', 'records'] })) {
      const record = entry.value;
      if (!this.#byId.has(record.id)) this.#records.push(record);
      this.#byId.set(record.id, record);
    }
    this.#records = [...this.#byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const now = new Date().toISOString();
    for (const [id, label, detail] of [
      ['job_export', 'Export records', 'CSV export of the current period'],
      ['job_ledger', 'Sync ledger', 'Reconcile payments with the ledger'],
      ['job_index', 'Reindex search', 'Rebuild the record search index'],
    ] as const) {
      this.jobs.set(id, { id, label, detail, state: 'queued', progress: 0, updatedAt: now });
    }
  }

  get size(): number {
    return this.#records.length;
  }

  get(id: string): WorkspaceRecord | undefined {
    return this.#byId.get(id);
  }

  page(page: number, pageSize: number, query?: string, status?: RecordStatus): RecordPage {
    const needle = query?.trim().toLowerCase();
    const rows = this.#records.filter((record) =>
      (!status || record.status === status) &&
      (!needle || record.reference.toLowerCase().includes(needle) || record.ownerName.toLowerCase().includes(needle))
    );
    const start = (page - 1) * pageSize;
    return { rows: rows.slice(start, start + pageSize), total: rows.length, page, pageSize };
  }

  async upsert(record: WorkspaceRecord): Promise<WorkspaceRecord> {
    if (!this.#byId.has(record.id)) this.#records.unshift(record);
    else this.#records = this.#records.map((existing) => existing.id === record.id ? record : existing);
    this.#byId.set(record.id, record);
    this.#records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    await this.#kv.set(['workspace', 'records', record.id], record);
    return record;
  }

  overview(periodDays: number): Overview {
    const now = Date.now();
    const start = now - periodDays * DAY;
    const previousStart = start - periodDays * DAY;
    const current = this.#records.filter((record) => Date.parse(record.createdAt) >= start);
    const previous = this.#records.filter((record) => {
      const at = Date.parse(record.createdAt);
      return at >= previousStart && at < start;
    });
    const refunds = (rows: WorkspaceRecord[]) =>
      rows.length === 0 ? 0 : (rows.filter((row) => row.status === 'refunded').length / rows.length) * 100;
    const currencies = (['CHF', 'EUR'] as const).map((currency) => {
      const sum = (rows: WorkspaceRecord[]) => rows.filter((row) => row.currency === currency).reduce((total, row) => total + row.amount, 0);
      const count = (rows: WorkspaceRecord[]) => rows.filter((row) => row.currency === currency).length || 1;
      return {
        currency,
        amount: metric(Math.round(sum(current)), Math.round(sum(previous))),
        averageAmount: metric(Math.round(sum(current) / count(current)), Math.round(sum(previous) / count(previous))),
      };
    });
    const weekly: Overview['weekly'] = [];
    for (let week = 0; week < Math.ceil(periodDays / 7); week++) {
      const from = start + week * 7 * DAY;
      const to = Math.min(from + 7 * DAY, now);
      const count = current.filter((record) => {
        const at = Date.parse(record.createdAt);
        return at >= from && at < to;
      }).length;
      const label = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(from));
      weekly.push({ label, count });
    }
    return {
      periodDays,
      totals: {
        records: metric(current.length, previous.length),
        refundRate: metric(Math.round(refunds(current) * 10) / 10, Math.round(refunds(previous) * 10) / 10),
        currencies,
      },
      weekly,
      statusCounts: RECORD_STATUSES.map((status) => ({ status, count: current.filter((record) => record.status === status).length })),
      latest: this.#records.slice(0, 6),
    };
  }
}
