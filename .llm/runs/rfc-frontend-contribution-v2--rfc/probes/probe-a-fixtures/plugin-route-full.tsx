/** @jsxImportSource npm:preact@^10.29.2 */
import { createDefine, page, type RouteConfig } from 'jsr:@fresh/core@^2.3.3';
import { recordModuleLoad } from './load-counter.ts';

export interface ProbeState {
  trace?: string[];
  p1?: boolean;
  p2?: boolean;
}

const define = createDefine<ProbeState>();

recordModuleLoad('plugin-route-full');

export const css = ['/assets/plugin-widget.css'];

export const config: RouteConfig = {
  skipAppWrapper: false,
  skipInheritedLayouts: false,
};

export const handlers = define.handlers({
  GET(ctx) {
    ctx.state.trace = [...(ctx.state.trace ?? []), 'plugin-full-GET'];
    return page(
      {
        greeting: 'Widget Loaded via Lazy Normalizer',
        trace: ctx.state.trace,
        isPartial: ctx.isPartial,
      },
      {
        headers: {
          'x-plugin-handler': 'GET',
        },
      },
    );
  },
  POST(ctx) {
    return Response.json({ ok: true, method: ctx.req.method, path: ctx.url.pathname });
  },
});

export default define.page<typeof handlers>(function PluginFullWidgetPage({ data }) {
  return (
    <article data-plugin-widget='full'>
      <h2>{data.greeting}</h2>
      <p data-trace={data.trace.join(',')}>partial={String(data.isPartial)}</p>
    </article>
  );
});
