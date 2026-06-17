import { buildDeferFormState, sanitizeDeferSearchParams } from './DeferIsland.tsx';

function assertEquals<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${String(expected)}, received ${String(actual)}`);
  }
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
