export interface PortableRouteDataContext {
  readonly url: URL;
  readonly params: Readonly<Record<string, string>>;
  readonly state: Readonly<Record<string, unknown>>;
}

export type PortableHandlerResult<TData> =
  | { readonly data: TData }
  | { readonly redirect: string };

export interface PortableJobSummary {
  readonly id: string;
  readonly status: 'running' | 'idle';
}

export interface WorkersJobsData {
  readonly jobId: string;
  readonly filter: string;
  readonly correlationId: string;
  readonly jobs: readonly PortableJobSummary[];
}

export function loadWorkersJobsData(
  ctx: PortableRouteDataContext,
): Promise<PortableHandlerResult<WorkersJobsData>> {
  if (ctx.url.searchParams.get('unauth') === '1') {
    return Promise.resolve({ redirect: '/login' });
  }
  const filter = ctx.url.searchParams.get('status') ?? 'all';
  const jobId = ctx.params.id ?? 'default';
  const correlationId = typeof ctx.state.correlationId === 'string'
    ? ctx.state.correlationId
    : 'none';
  const allJobs: readonly PortableJobSummary[] = [
    { id: 'nightly-rollup', status: 'running' },
    { id: 'billing-sync', status: 'idle' },
  ];
  const jobs = filter === 'all'
    ? allJobs
    : allJobs.filter((job) => job.status === filter);
  return Promise.resolve({
    data: {
      jobId,
      filter,
      correlationId,
      jobs,
    },
  });
}
