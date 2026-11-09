/**
 * Workspace service contract: the same contract-first oRPC shape a scaffolded
 * NetScript service exposes (overview, records, jobs, session). The desktop UI
 * consumes it through `@netscript/sdk/client`; the embedded service implements
 * it with `@netscript/service`.
 */
import { oc } from '@orpc/contract';
import { z } from 'zod';

export const RECORD_STATUSES = ['pending', 'awaiting_payment', 'paid', 'shipped', 'refunded', 'cancelled'] as const;
export type RecordStatus = (typeof RECORD_STATUSES)[number];

export const STATUS_LABEL: Record<RecordStatus, string> = {
  pending: 'Pending',
  awaiting_payment: 'Awaiting payment',
  paid: 'Paid',
  shipped: 'Shipped',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

export const RecordSchema = z.object({
  id: z.string(),
  reference: z.string(),
  ownerName: z.string(),
  status: z.enum(RECORD_STATUSES),
  amount: z.number(),
  currency: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type WorkspaceRecord = z.infer<typeof RecordSchema>;

const MetricSchema = z.object({
  current: z.number(),
  previous: z.number(),
  delta: z.number(),
  percentChange: z.number().nullable(),
});
export type Metric = z.infer<typeof MetricSchema>;

export const OverviewSchema = z.object({
  periodDays: z.number(),
  totals: z.object({
    records: MetricSchema,
    refundRate: MetricSchema,
    currencies: z.array(z.object({
      currency: z.enum(['CHF', 'EUR']),
      amount: MetricSchema,
      averageAmount: MetricSchema,
    })),
  }),
  weekly: z.array(z.object({ label: z.string(), count: z.number() })),
  statusCounts: z.array(z.object({ status: z.enum(RECORD_STATUSES), count: z.number() })),
  latest: z.array(RecordSchema),
});
export type Overview = z.infer<typeof OverviewSchema>;

export const JobSchema = z.object({
  id: z.string(),
  label: z.string(),
  state: z.enum(['queued', 'running', 'completed', 'failed']),
  progress: z.number(),
  detail: z.string(),
  updatedAt: z.string(),
});
export type Job = z.infer<typeof JobSchema>;

export const SessionSchema = z.object({ subject: z.string(), name: z.string(), email: z.string() });
export type Session = z.infer<typeof SessionSchema>;

export const PageSchema = z.object({
  rows: z.array(RecordSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type RecordPage = z.infer<typeof PageSchema>;

export const workspaceContract = {
  overview: {
    get: oc.route({ method: 'GET' }).input(z.object({ periodDays: z.number().int().min(7).max(90) })).output(OverviewSchema),
  },
  records: {
    list: oc.route({ method: 'GET' })
      .input(z.object({
        page: z.number().int().min(1),
        pageSize: z.number().int().min(1).max(5000),
        query: z.string().optional(),
        status: z.enum(RECORD_STATUSES).optional(),
      }))
      .output(PageSchema),
    get: oc.route({ method: 'GET' }).input(z.object({ id: z.string() })).output(RecordSchema),
    setStatus: oc.input(z.object({ id: z.string(), status: z.enum(RECORD_STATUSES) })).output(RecordSchema),
    create: oc.input(z.object({ ownerName: z.string().min(1), amount: z.number().positive(), currency: z.string().regex(/^[A-Z]{3}$/) }))
      .output(RecordSchema),
  },
  jobs: {
    list: oc.route({ method: 'GET' }).input(z.object({})).output(z.array(JobSchema)),
  },
  session: {
    me: oc.route({ method: 'GET' }).input(z.object({})).output(SessionSchema.nullable()),
  },
};

export type WorkspaceContract = typeof workspaceContract;

/** Activity entries carried by the durable stream (`type: "activity"`). */
export interface ActivityEntry {
  readonly id: string;
  readonly actor: string;
  readonly verb: string;
  readonly label: string;
  readonly recordId?: string;
  readonly timestamp: string;
}

export const SERVICE_NAME = 'workspace';
export const ACTIVITY_STREAM_PATH = '/v1/stream/workspace/activity';
export const SESSION_COOKIE = 'ns_session';
