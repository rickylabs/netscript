import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { h } from 'preact';
import { render as renderToString } from 'preact-render-to-string';
import { Partial } from 'fresh/runtime';
import {
  buildDeferFormState,
  type DeferComponentProps,
  sanitizeDeferSearchParams,
} from './DeferIsland.tsx';
import { DeferComponent } from './island.ts';
import { DeferPage, type DeferPageProps } from './DeferPage.tsx';

interface VNodeLike {
  readonly type: unknown;
  readonly props: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertVNode(value: unknown, message: string): asserts value is VNodeLike {
  assert(isRecord(value), message);
  assert('type' in value, message);
  assert('props' in value && isRecord(value.props), message);
}

function childVNodes(value: unknown): VNodeLike[] {
  const children = Array.isArray(value) ? value : [value];
  return children.filter((child): child is VNodeLike => {
    return isRecord(child) && 'type' in child && 'props' in child && isRecord(child.props);
  });
}

function renderDeferPage(
  overrides: Pick<DeferPageProps, 'component'> & { readonly isPartialRequest: boolean },
): VNodeLike {
  const url = new URL('http://localhost/dashboard?tab=activity');
  const tree = DeferPage({
    action: '/dashboard',
    partial: '/partials/dashboard/panel',
    name: 'panel',
    fallback: 'loading panel',
    component: overrides.component,
    ctx: {
      url,
      req: new Request(url, { headers: { 'X-Defer-Prewarm': '1' } }),
      isPartial: overrides.isPartialRequest,
    },
  });
  assertVNode(tree, 'Expected DeferPage to return a vnode');
  return tree;
}

function partialChild(tree: VNodeLike): VNodeLike {
  // Preact's precompiled JSX stores dynamic children in `exprs` rather than
  // `children`; support both shapes so this pins the emitted server tree.
  const children = childVNodes(tree.props.children ?? tree.props.exprs);
  assertEquals(children.length, 1, 'Expected the region Partial to be the only outer child');
  const partial = children[0];
  assert(partial.type === Partial, 'Expected the outer child to be the named Fresh Partial');
  return partial;
}

Deno.test('sanitizeDeferSearchParams preserves real route state', () => {
  assertEquals(
    sanitizeDeferSearchParams('page=1&limit=2&sortBy=freshness&sortOrder=desc'),
    'page=1&limit=2&sortBy=freshness&sortOrder=desc',
    'Expected real route state params to be preserved',
  );
});

Deno.test('sanitizeDeferSearchParams removes fresh partial transport params only', () => {
  assertEquals(
    sanitizeDeferSearchParams('page=1&limit=2&fresh-partial=true'),
    'page=1&limit=2',
    'Expected fresh-partial to be removed from page-state params',
  );
  assertEquals(
    sanitizeDeferSearchParams('panel=activity&section=navigation&fresh-partial=true'),
    'panel=activity&section=navigation',
    'Expected partial-layer params to survive transport param stripping',
  );
});

Deno.test('sanitizeDeferSearchParams returns undefined when only transport params remain', () => {
  assertEquals(
    sanitizeDeferSearchParams('fresh-partial=true'),
    undefined,
    'Expected transport-only params to collapse to undefined',
  );
  assertEquals(
    sanitizeDeferSearchParams(undefined),
    undefined,
    'Expected missing params to stay undefined',
  );
});

Deno.test('buildDeferFormState keeps page-state params as GET inputs and only partial extras in the partial URL', () => {
  const state = buildDeferFormState(
    'page=1&limit=2&sortBy=freshness&sortOrder=desc',
    'page=1&limit=2&sortBy=freshness&sortOrder=desc&panel=activity&section=navigation',
  );

  assertEquals(
    JSON.stringify(state.formEntries),
    JSON.stringify([
      ['page', '1'],
      ['limit', '2'],
      ['sortBy', 'freshness'],
      ['sortOrder', 'desc'],
    ]),
    'Expected shared route-state params to become hidden GET inputs',
  );
  assertEquals(
    state.partialQuery,
    'panel=activity&section=navigation',
    'Expected the partial URL to keep only partial-specific params',
  );
});

Deno.test('DeferComponent enables f-client-nav for every request and cache combination', () => {
  const combinations = [
    { isPartialRequest: false, hasCachedData: false },
    { isPartialRequest: false, hasCachedData: true },
    { isPartialRequest: true, hasCachedData: false },
    { isPartialRequest: true, hasCachedData: true },
  ] as const satisfies readonly Pick<
    DeferComponentProps,
    'isPartialRequest' | 'hasCachedData'
  >[];

  for (const combination of combinations) {
    const html = renderToString(h(DeferComponent, {
      action: '/dashboard',
      partial: '/partials/dashboard/panel',
      ...combination,
    }));

    assertStringIncludes(
      html,
      ' f-client-nav',
      `Expected client navigation for ${JSON.stringify(combination)}`,
    );
  }
});

Deno.test('DeferPage server tree carries the registered defer island component identity', () => {
  const partial = partialChild(
    renderDeferPage({ component: undefined, isPartialRequest: false }),
  );
  const coordinator = childVNodes(partial.props.children).find((child) =>
    child.type === DeferComponent
  );

  assert(
    coordinator !== undefined,
    'Expected server output to carry the exact component exported by the defer island subpath',
  );
});

Deno.test('DeferPage keeps the coordinator inside the named partial across miss-to-hit swaps', () => {
  const states = [
    renderDeferPage({ component: undefined, isPartialRequest: false }),
    renderDeferPage({ component: 'loaded panel', isPartialRequest: true }),
  ];

  for (const [index, tree] of states.entries()) {
    const partial = partialChild(tree);
    const partialChildren = childVNodes(partial.props.children);
    const coordinator = partialChildren.find((child) => child.type === DeferComponent);

    assert(coordinator !== undefined, `Expected swap state ${index} to include the coordinator`);
    assertEquals(
      coordinator.props.hasCachedData,
      index === 1,
      `Expected swap state ${index} to carry current cache state`,
    );
    assertEquals(
      coordinator.props.isPartialRequest,
      index === 1,
      `Expected swap state ${index} to carry current partial-request state`,
    );
  }
});
