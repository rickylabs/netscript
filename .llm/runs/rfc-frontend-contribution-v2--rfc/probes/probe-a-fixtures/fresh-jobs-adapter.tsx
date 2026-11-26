/** @jsxImportSource npm:preact@^10.29.2 */
import { page, type Context, type PageProps, type RouteConfig } from 'jsr:@fresh/core@^2.3.3';
import type { VNode } from 'npm:preact@^10.29.2';
import { recordModuleLoad } from './load-counter.ts';
import { loadWorkersJobsData, type WorkersJobsData } from './portable-jobs-loader.ts';

recordModuleLoad('fresh-jobs-adapter');

export const css: readonly string[] = ['/plugins/workers/jobs.css'];

export const config: RouteConfig = {
  skipAppWrapper: false,
  skipInheritedLayouts: false,
};

export interface FreshJobsState {
  correlationId?: string;
}

export const handlers: {
  readonly GET: (ctx: Context<FreshJobsState>) => Promise<Response | { readonly data: WorkersJobsData }>;
} = {
  async GET(ctx: Context<FreshJobsState>): Promise<Response | { readonly data: WorkersJobsData }> {
    const result = await loadWorkersJobsData({
      url: ctx.url,
      params: ctx.params,
      state: { correlationId: ctx.state.correlationId },
    });
    if ('redirect' in result) {
      return ctx.redirect(result.redirect, 302);
    }
    return page(result.data);
  },
};

export default function FreshWorkersJobsPage({
  data,
  isPartial,
}: PageProps<WorkersJobsData, FreshJobsState>): VNode {
  return (
    <section
      data-fresh-jobs-adapter='true'
      data-job-id={data.jobId}
      data-filter={data.filter}
      data-correlation-id={data.correlationId}
      data-is-partial={String(isPartial)}
      data-jobs-json={JSON.stringify(data.jobs)}
    >
      <h2>Workers Jobs ({data.jobId})</h2>
    </section>
  );
}
