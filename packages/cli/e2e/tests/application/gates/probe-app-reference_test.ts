import { assertEquals, assertRejects, assertThrows } from '@std/assert';

import {
  assertReferenceDom,
  probeAppReference,
  REFERENCE_EXPECTATIONS,
  REFERENCE_VIEWPORTS,
} from '../../../src/application/gates/scaffold/runtime/probe-app-reference.ts';

const EXPECTED_VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

const EXPECTED_STATES = [
  { path: '/', markers: ['href="/design"', 'href="/design/composition"'] },
  { path: '/design/composition', markers: ['Composition', 'L0'] },
  { path: '/examples/users?preview=loading', markers: ['data-state="loading"'] },
  {
    path: '/examples/users?preview=error',
    markers: ['data-state="error"', 'Resource list unavailable'],
  },
  { path: '/examples/users?preview=empty', markers: ['data-state="empty"', 'No resources yet'] },
  { path: '/examples/users?preview=success', markers: ['data-state="success"'] },
  {
    path: '/examples/users?preview=optimistic',
    markers: ['data-state="optimistic"', 'Optimistic update is visible'],
  },
  {
    path: '/examples/users?preview=rollback',
    markers: ['data-state="rollback"', 'saved cache snapshot was restored'],
  },
  {
    path: '/examples/users?preview=confirmed',
    markers: ['data-state="confirmed"', 'service confirmed the mutation'],
  },
] as const;

Deno.test('reference probe renders every named state at desktop and mobile viewports', async () => {
  assertEquals(REFERENCE_VIEWPORTS, EXPECTED_VIEWPORTS);
  assertEquals(REFERENCE_EXPECTATIONS, EXPECTED_STATES);
  const observed: string[] = [];
  await probeAppReference('/workspace/project', 'inventory-web', '/workspace/apphost.mts', {
    resolveLiveUrls: () => Promise.resolve(['http://localhost:41234/']),
    render: (url, viewport) => {
      observed.push(`${viewport.name}:${new URL(url).pathname}${new URL(url).search}`);
      const expectation = REFERENCE_EXPECTATIONS.find((candidate) => url.endsWith(candidate.path));
      if (!expectation) throw new Error(`unexpected URL: ${url}`);
      return Promise.resolve(`<html>${expectation.markers.join(' ')}</html>`);
    },
    log: () => {},
  });

  assertEquals(observed.length, REFERENCE_EXPECTATIONS.length * REFERENCE_VIEWPORTS.length);
  assertEquals(observed.some((entry) => entry.startsWith('desktop:')), true);
  assertEquals(observed.some((entry) => entry.startsWith('mobile:')), true);
});

Deno.test('reference probe rejects the old route with no rendered state marker', () => {
  const expectation = REFERENCE_EXPECTATIONS.find((candidate) =>
    candidate.path === '/examples/users?preview=rollback'
  );
  if (!expectation) throw new Error('rollback expectation missing');

  assertThrows(
    () =>
      assertReferenceDom(
        '<html><body>old service example</body></html>',
        expectation,
        REFERENCE_VIEWPORTS[0],
      ),
    Error,
    'did not render data-state="rollback"',
  );
});

Deno.test('reference probe reports a missing semantic marker from the rendered browser DOM', async () => {
  await assertRejects(
    () =>
      probeAppReference('/workspace/project', 'inventory-web', '/workspace/apphost.mts', {
        resolveLiveUrls: () => Promise.resolve(['http://localhost:41234/']),
        render: () => Promise.resolve('<html><body>incomplete</body></html>'),
        log: () => {},
      }),
    Error,
    'did not render',
  );
});
