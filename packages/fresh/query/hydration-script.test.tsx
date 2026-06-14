import { assertStringIncludes } from '@std/assert';
import { render as renderToString } from 'preact-render-to-string';
import { HydrationBoundary, QueryHydrationScript } from './hydration-script.tsx';
import type { DehydratedState } from './query-types.ts';

const state: DehydratedState = {
  mutations: [],
  queries: [{ state: '<unsafe>' }],
};

Deno.test('QueryHydrationScript renders escaped dehydrated state', () => {
  const html = renderToString(<QueryHydrationScript id='query-state' state={state} />);

  assertStringIncludes(html, 'id="query-state"');
  assertStringIncludes(html, 'type="application/json"');
  assertStringIncludes(html, 'data-netscript-query-state="true"');
  assertStringIncludes(html, '\\u003cunsafe>');
});

Deno.test('HydrationBoundary renders children during server rendering', () => {
  const html = renderToString(
    <HydrationBoundary state={state}>
      <span>hydrated</span>
    </HydrationBoundary>,
  );

  assertStringIncludes(html, '<span>hydrated</span>');
});
