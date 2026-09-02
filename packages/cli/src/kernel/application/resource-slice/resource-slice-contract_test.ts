import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import {
  markOwnedResourceSliceLeaf,
  normalizeResourceSliceInput,
  parseOwnedResourceSliceLeaf,
} from './resource-slice-contract.ts';

const CLIENT = {
  serviceName: 'orders',
  moduleSpecifier: '@app/lib/orders.ts',
  queryFactoryName: 'ordersQueries',
} as const;
const PROCEDURE = { path: ['list'] as const, kind: 'query' } as const;

Deno.test('normalizes resource naming and default route identities', () => {
  const input = normalizeResourceSliceInput({
    resource: ' Order Items ',
    app: 'dashboard',
    client: CLIENT,
    procedure: PROCEDURE,
  });

  assertEquals(input.resource, 'order-items');
  assertEquals(input.resourcePascalCase, 'OrderItems');
  assertEquals(input.resourceCamelCase, 'orderItems');
  assertEquals(input.routeAlias, 'orderItems');
  assertEquals(input.route, '/order-items');
  assertEquals(input.variants, ['core']);
});

Deno.test('maps a static nested route to exact page and partial locations', () => {
  const input = normalizeResourceSliceInput({
    resource: 'orders',
    app: 'dashboard',
    route: '/orders/history',
    variants: ['stream', 'form', 'form', 'partial'],
    client: CLIENT,
    procedure: PROCEDURE,
  });

  assertEquals(input.routeSegments, ['orders', 'history']);
  assertEquals(input.routeDirectory, 'routes/orders/history');
  assertEquals(
    input.partialRouteFile,
    'routes/partials/orders/history/summary.tsx',
  );
  assertEquals(input.variants, ['core', 'form', 'partial', 'stream']);
});

Deno.test('rejects empty resource normalization and non-static route syntax', () => {
  assertThrows(
    () =>
      normalizeResourceSliceInput({
        resource: '---',
        app: 'dashboard',
        client: CLIENT,
        procedure: PROCEDURE,
      }),
    Error,
    'cannot be normalized',
  );
  assertThrows(
    () =>
      normalizeResourceSliceInput({
        resource: '123 orders',
        app: 'dashboard',
        client: CLIENT,
        procedure: PROCEDURE,
      }),
    Error,
    'safe TypeScript identifiers',
  );

  for (
    const route of [
      'orders',
      '/',
      '/orders/',
      '/orders//history',
      '/orders/[id]',
      '/orders/[...path]',
      '/orders/:id',
      '/orders/*path',
      '/orders?tab=all',
      '/Orders',
    ]
  ) {
    assertThrows(
      () =>
        normalizeResourceSliceInput({
          resource: 'orders',
          app: 'dashboard',
          route,
          client: CLIENT,
          procedure: PROCEDURE,
        }),
      Error,
    );
  }
});

Deno.test('writes and parses the exact canonical first-line marker', async () => {
  const content = await markOwnedResourceSliceLeaf(
    { resource: 'orders', role: 'page', options: ['form', 'core'] },
    'export const page = true;\n',
  );
  assertEquals(
    content.split('\n')[0],
    '// @netscript/resource-slice {"schema":1,"resource":"orders","role":"page","options":["core","form"],"bodySha256":"68ce9f712800f8006bc8177f4525c6a5d69e9fe0e449dfc631f8cd0851ca84af"}',
  );
  assertEquals(parseOwnedResourceSliceLeaf(content), {
    schema: 1,
    resource: 'orders',
    role: 'page',
    options: ['core', 'form'],
    bodySha256: '68ce9f712800f8006bc8177f4525c6a5d69e9fe0e449dfc631f8cd0851ca84af',
  });
});

Deno.test('rejects non-canonical, malformed, and unsupported marker lines', () => {
  const hash = 'a'.repeat(64);
  assertEquals(parseOwnedResourceSliceLeaf('export const page = true;\n'), undefined);
  assertEquals(
    parseOwnedResourceSliceLeaf(
      `// @netscript/resource-slice {bad json}\nbody\n`,
    ),
    undefined,
  );
  assertEquals(
    parseOwnedResourceSliceLeaf(
      `// @netscript/resource-slice {"resource":"orders","schema":1,"role":"page","options":["core"],"bodySha256":"${hash}"}\nbody\n`,
    ),
    undefined,
  );
  assertEquals(
    parseOwnedResourceSliceLeaf(
      `// @netscript/resource-slice {"schema":2,"resource":"orders","role":"page","options":["core"],"bodySha256":"${hash}"}\nbody\n`,
    ),
    undefined,
  );
});

Deno.test('requires LF-terminated generated bodies', async () => {
  await assertRejects(
    () =>
      markOwnedResourceSliceLeaf(
        { resource: 'orders', role: 'page', options: ['core'] },
        'export const page = true;',
      ),
    Error,
    'end with LF',
  );
  await assertRejects(
    () =>
      markOwnedResourceSliceLeaf(
        { resource: 'orders', role: 'page', options: ['form'] },
        'export const page = true;\n',
      ),
    Error,
    'must include core',
  );
  await assertRejects(
    () =>
      markOwnedResourceSliceLeaf(
        { resource: 'orders', role: 'page', options: ['core', 'core'] },
        'export const page = true;\n',
      ),
    Error,
    'must be unique',
  );
});
