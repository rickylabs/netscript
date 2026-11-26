/** @jsxImportSource npm:preact@^10.29.2 */
import type { Context, PageProps, RouteConfig } from 'jsr:@fresh/core@^2.3.3';

export interface PureDataState {
  trace?: string[];
  tenant?: string;
}

export interface PurePluginData {
  readonly tenant: string;
  readonly trace: readonly string[];
  readonly itemId: string;
}

export const css = ['/assets/pure-data-page.css'];

export const config: RouteConfig = {
  skipAppWrapper: false,
  skipInheritedLayouts: false,
};

// Fresh-3-compatible handler shape: returns plain `{ data }` (no inline `ctx.render()`)
export const handlers = {
  GET(ctx: Context<PureDataState>): { data: PurePluginData } {
    ctx.state.trace = [...(ctx.state.trace ?? []), 'pure-handler-GET'];
    return {
      data: {
        tenant: ctx.state.tenant ?? 'default',
        trace: ctx.state.trace,
        itemId: ctx.params.id ?? 'none',
      },
    };
  },
};

// Pure page component: receives `{ data, state, isPartial }` and returns JSX (no `ctx.render()`)
export default function PureDataPluginPage({
  data,
  isPartial,
}: PageProps<PurePluginData, PureDataState>) {
  return (
    <section
      data-pure-plugin-page='true'
      data-tenant={data.tenant}
      data-item-id={data.itemId}
      data-trace={data.trace.join(',')}
      data-is-partial={String(isPartial)}
    >
      <h2>Pure Plugin Page ({data.tenant})</h2>
      <span>Item: {data.itemId}</span>
    </section>
  );
}
