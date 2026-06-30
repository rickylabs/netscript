import { paginationSearchSchema } from '../builders/define-page/search-params.ts';
import {
  bindRoutePattern,
  createRouteReference,
  defineEnumPathParam,
  defineRouteContract,
  enumPathParamSchema,
  type InferRouteContractPath,
  type InferRouteContractSearch,
  type InferRoutePatternPath,
} from './contract.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

Deno.test('enumPathParamSchema validates literal path params', () => {
  const schema = enumPathParamSchema('section', ['overview', 'navigation', 'mutation']);
  const valid = schema.safeParse({ section: 'navigation' });
  const invalid = schema.safeParse({ section: 'legacy' });

  assert(valid.success, 'Expected known path param to parse');
  assert(valid.data.section === 'navigation', 'Expected parsed section value');
  assert(!invalid.success, 'Expected unknown path param to fail');
});

Deno.test('defineEnumPathParam exposes values, schema, and parser together', () => {
  const sectionParam = defineEnumPathParam('section', ['overview', 'navigation', 'mutation']);

  assert(sectionParam.values[1] === 'navigation', 'Expected enum values to be preserved');
  assert(sectionParam.parse('mutation') === 'mutation', 'Expected parser to resolve known values');
  assert(sectionParam.parse('legacy') === null, 'Expected parser to reject unknown values');
});

Deno.test('bindRoutePattern preserves schemas alongside nav and route pattern', () => {
  const contract = defineRouteContract({
    pathSchema: enumPathParamSchema('section', ['overview', 'navigation', 'mutation']),
    searchSchema: paginationSearchSchema({
      defaultLimit: 3,
      defaultSort: 'freshness',
      defaultOrder: 'desc',
    }),
  });

  const bound = bindRoutePattern(contract, '/dashboard/framework/wi-09/[section]');
  const parsedPath = bound.pathSchema?.safeParse({ section: 'mutation' });
  const href = bound.nav.makeHref({
    path: { section: 'overview' },
    search: { page: 1, limit: 3, sortBy: 'freshness', sortOrder: 'desc' },
  });

  assert(
    bound.routePattern === '/dashboard/framework/wi-09/[section]',
    'Expected route pattern to be preserved',
  );
  assert(
    parsedPath?.success && parsedPath.data.section === 'mutation',
    'Expected bound path schema to remain available',
  );
  assert(href.includes('/dashboard/framework/wi-09/overview'), `Unexpected href: ${href}`);
  assert(!('RouteLink' in bound.nav), 'Expected bound route nav to expose only makeHref');
  assert(!('getLinkProps' in bound.nav), 'Expected duplicate nav link helpers to be removed');
});

Deno.test('getLinkProps builds anchor props from a bound route contract target', () => {
  const contract = defineRouteContract({
    pathSchema: enumPathParamSchema('section', ['overview', 'navigation', 'mutation']),
    searchSchema: paginationSearchSchema({
      defaultLimit: 3,
      defaultSort: 'freshness',
      defaultOrder: 'desc',
    }),
  });

  const bound = bindRoutePattern(contract, '/dashboard/framework/wi-09/[section]');
  const linkProps = bound.getLinkProps({
    path: { section: 'navigation' },
    search: { page: 2, limit: 2, sortBy: 'duration', sortOrder: 'asc' },
    class: 'ns-link',
  });
  const url = new URL(linkProps.href, 'https://netscript.local');

  assert(
    url.pathname === '/dashboard/framework/wi-09/navigation',
    `Unexpected href: ${linkProps.href}`,
  );
  assert(url.searchParams.get('page') === '2', `Unexpected href: ${linkProps.href}`);
  assert(url.searchParams.get('limit') === '2', `Unexpected href: ${linkProps.href}`);
  assert(url.searchParams.get('offset') === '2', `Unexpected href: ${linkProps.href}`);
  assert(url.searchParams.get('sortBy') === 'duration', `Unexpected href: ${linkProps.href}`);
  assert(url.searchParams.get('sortOrder') === 'asc', `Unexpected href: ${linkProps.href}`);
  assert(linkProps.class === 'ns-link', 'Expected anchor props to be preserved');
  assert(linkProps['f-client-nav'] === true, 'Expected client navigation to default on');
});

Deno.test('bound route contract exposes getLinkProps directly', () => {
  const contract = defineRouteContract({
    pathSchema: enumPathParamSchema('section', ['overview', 'navigation', 'mutation']),
    searchSchema: paginationSearchSchema({
      defaultLimit: 3,
      defaultSort: 'freshness',
      defaultOrder: 'desc',
    }),
  });

  const bound = bindRoutePattern(contract, '/dashboard/framework/wi-09/[section]');
  const linkProps = bound.getLinkProps({
    path: { section: 'mutation' },
    search: { page: 3 },
  });
  const url = new URL(linkProps.href, 'https://netscript.local');

  assert(
    url.pathname === '/dashboard/framework/wi-09/mutation',
    `Unexpected href: ${linkProps.href}`,
  );
  assert(url.searchParams.get('page') === '3', `Unexpected href: ${linkProps.href}`);
});

Deno.test('route contracts expose parse helpers for path params and URLSearchParams', () => {
  const contract = defineRouteContract({
    pathSchema: enumPathParamSchema('section', ['overview', 'navigation', 'mutation']),
    searchSchema: paginationSearchSchema({
      defaultLimit: 3,
      defaultSort: 'freshness',
      defaultOrder: 'desc',
    }),
  });
  const bound = bindRoutePattern(contract, '/dashboard/framework/wi-09/[section]');

  const parsedPath: InferRouteContractPath<typeof contract> = contract.parsePath({
    section: 'navigation',
  });
  const parsedSearch: InferRouteContractSearch<typeof contract> = contract.parseSearch(
    new URLSearchParams('page=2&limit=2&sortBy=duration&sortOrder=asc'),
  );
  const invalidPath = contract.safeParsePath({ section: 'legacy' });
  const boundPath = bound.parsePath({ section: 'mutation' });

  assert(
    parsedPath.section === 'navigation',
    `Unexpected parsed path: ${JSON.stringify(parsedPath)}`,
  );
  assert(parsedSearch.page === 2, `Unexpected parsed page: ${JSON.stringify(parsedSearch)}`);
  assert(
    parsedSearch.sortBy === 'duration',
    `Unexpected parsed search: ${JSON.stringify(parsedSearch)}`,
  );
  assert(!invalidPath.success, 'Expected invalid path params to fail safe parsing');
  assert(
    boundPath.section === 'mutation',
    `Unexpected bound parsed path: ${JSON.stringify(boundPath)}`,
  );
});

Deno.test('getLinkProps fails loudly when path params do not satisfy the target contract', () => {
  const contract = defineRouteContract({
    pathSchema: enumPathParamSchema('section', ['overview', 'navigation', 'mutation']),
  });

  const bound = bindRoutePattern(contract, '/dashboard/framework/wi-09/[section]');

  let message = '';
  try {
    bound.getLinkProps({
      path: { section: 'legacy' as 'overview' },
    });
  } catch (error: unknown) {
    message = error instanceof Error ? error.message : String(error);
  }

  assert(message.includes('invalid path params'), `Unexpected error message: ${message}`);
});

Deno.test('createRouteReference infers dynamic, catch-all, optional catch-all, and static href behavior from the route pattern', () => {
  const detailRoute = createRouteReference('/dashboard/products/[id]/edit', {
    id: 'dashboard.products.$id.edit',
    kind: 'page',
  });
  const splatRoute = createRouteReference('/dashboard/[...admin]');
  const optionalSplatRoute = createRouteReference('/docs/[[...slug]]');
  const staticRoute = createRouteReference('/dashboard/products');

  const detailPath: InferRouteContractPath<typeof detailRoute> = {
    id: 'product-42',
  } as InferRouteContractPath<
    typeof detailRoute
  >;
  const splatPath = {
    admin: ['settings', 'users'] as const,
  } as unknown as InferRouteContractPath<typeof splatRoute>;
  const optionalSplatPath = {
    slug: ['guides', 'install'] as const,
  } as unknown as InferRouteContractPath<typeof optionalSplatRoute>;

  const detailHref = detailRoute.href({ path: detailPath });
  const splatHref = splatRoute.href({ path: splatPath });
  const parsedSplat = splatRoute.parsePath({ admin: 'settings/users' });
  const optionalSplatHref = optionalSplatRoute.href({ path: optionalSplatPath });
  const optionalSplatRootHref = optionalSplatRoute.href({ path: {} });
  const parsedOptionalSplat = optionalSplatRoute.parsePath({ slug: 'guides/install' });
  const staticHref = staticRoute.href();

  assert(
    detailHref === '/dashboard/products/product-42/edit',
    `Unexpected detail href: ${detailHref}`,
  );
  assert(splatHref === '/dashboard/settings/users', `Unexpected splat href: ${splatHref}`);
  assert(
    parsedSplat.admin[0] === 'settings',
    `Unexpected parsed splat path: ${JSON.stringify(parsedSplat)}`,
  );
  assert(
    parsedSplat.admin[1] === 'users',
    `Unexpected parsed splat path: ${JSON.stringify(parsedSplat)}`,
  );
  assert(
    optionalSplatHref === '/docs/guides/install',
    `Unexpected optional splat href: ${optionalSplatHref}`,
  );
  assert(
    optionalSplatRootHref === '/docs',
    `Unexpected optional root href: ${optionalSplatRootHref}`,
  );
  assert(
    parsedOptionalSplat.slug?.join('/') === 'guides/install',
    `Unexpected parsed optional splat path: ${JSON.stringify(parsedOptionalSplat)}`,
  );
  assert(staticHref === '/dashboard/products', `Unexpected static href(): ${staticHref}`);
  assert(
    staticRoute.$href === '/dashboard/products',
    `Unexpected static href: ${staticRoute.$href}`,
  );
});

Deno.test('pairRouteTargets keeps page and partial hrefs aligned', () => {
  const pageRoute = bindRoutePattern(
    defineRouteContract({
      searchSchema: paginationSearchSchema({
        defaultLimit: 10,
        defaultSort: 'createdAt',
        defaultOrder: 'desc',
      }),
    }),
    '/dashboard/users',
  );
  const partialRoute = createRouteReference('/partials/dashboard/users/list', {
    kind: 'partial',
  });

  const paired = pageRoute.withPartial(partialRoute);
  const linkProps = paired.getLinkProps({
    search: { page: 2, limit: 20, sortBy: 'updatedAt', sortOrder: 'asc' },
    class: 'ns-link',
  });

  assert(linkProps.href.includes('/dashboard/users'), `Unexpected page href: ${linkProps.href}`);
  assert(
    linkProps['f-partial'].includes('/partials/dashboard/users/list'),
    'Expected partial href to target the partial route',
  );
  assert(
    linkProps['f-partial'].includes('page=2'),
    `Unexpected partial href: ${linkProps['f-partial']}`,
  );
  assert(linkProps.class === 'ns-link', 'Expected paired link props to preserve anchor props');
});

Deno.test('InferRoutePatternPath infers static segments as {} (regression for #178)', () => {
  // Compile-time-only assertions — these reference the public type alias directly
  // and assign values without `as unknown as` casts, so any regression in
  // `InferRoutePatternSegment` / `InferRoutePatternPathSegments` surfaces as a
  // TS2322 here at type-check.

  // Multi-segment dynamic routes must not collapse to `never`.
  const channel: InferRoutePatternPath<'/channel/[id]'> = { id: 'c-123' };
  const session: InferRoutePatternPath<'/session/[a]/[b]'> = { a: 'one', b: 'two' };

  // Single dynamic segment with no static prefix is unaffected.
  const onlyDynamic: InferRoutePatternPath<'/[id]'> = { id: 'd-1' };

  // Static-only routes must resolve to `{}`, not `Record<string, never>`.
  const staticOnly: InferRoutePatternPath<'/static/only'> = {};
  // Object literal that has no properties must satisfy `{}`.
  const emptyObjectLiteral: InferRoutePatternPath<'/static/only'> = {};

  // Optional catch-all keeps its optional shape.
  const optionalSplat: InferRoutePatternPath<'/posts/[[...slug]]'> = {};
  const optionalSplatWithValue: InferRoutePatternPath<'/posts/[[...slug]]'> = {
    slug: ['a', 'b'],
  };

  // The existing internal test case from issue #178.
  const dashboardProductEdit: InferRoutePatternPath<'/dashboard/products/[id]/edit'> = {
    id: 'product-42',
  };

  // Runtime sanity: the inferred types flow into href() calls without casts.
  const channelRef = createRouteReference('/channel/[id]');
  assert(
    channelRef.href({ path: channel }) === '/channel/c-123',
    `Unexpected href: ${channelRef.href({ path: channel })}`,
  );
  assert(
    session.a === 'one' && session.b === 'two',
    'Expected session path fields to be assignable as string',
  );
  assert(onlyDynamic.id === 'd-1', 'Expected onlyDynamic.id to be assignable as string');
  assert(
    Object.keys(staticOnly).length === 0,
    'Expected staticOnly to be assignable as empty object',
  );
  assert(
    Object.keys(emptyObjectLiteral).length === 0,
    'Expected emptyObjectLiteral to satisfy {}',
  );
  assert(optionalSplat.slug === undefined, 'Expected optionalSplat.slug to be optional');
  assert(
    optionalSplatWithValue.slug?.join('/') === 'a/b',
    `Unexpected optional splat: ${optionalSplatWithValue.slug?.join('/')}`,
  );
  assert(
    dashboardProductEdit.id === 'product-42',
    'Expected dashboardProductEdit.id to be assignable as string',
  );
});
