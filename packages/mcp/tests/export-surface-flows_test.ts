import { assert, assertEquals, assertMatch } from '@std/assert';
import {
  createExportSurfaceFlows,
  EXPORT_JSDOC_CHARACTER_LIMIT,
  type ExportSurfaceCorpusPort,
} from '../mod.ts';
import {
  EXPORT_SURFACE_FIXTURE,
  FixtureExportSurfaceCorpus,
} from './fixtures/export-surfaces/corpus.fixture.ts';

const flows = createExportSurfaceFlows(new FixtureExportSurfaceCorpus());

Deno.test('find_export answers which package and subpath export an exact symbol', async () => {
  const result = await flows.find_export({ symbol: 'definePage' });
  assert(result.ok);
  assertEquals(result.value, {
    symbol: 'definePage',
    total: 2,
    matches: [
      { package: '@netscript/fresh', subpath: './builders', kind: 'function' },
      { package: '@netscript/fresh-ui', subpath: './builder', kind: 'function' },
    ],
    truncated: false,
  });
});

Deno.test('list_package_exports groups a bounded declaration page by export subpath', async () => {
  const result = await flows.list_package_exports({ package: '@netscript/fresh', limit: 2 });
  assert(result.ok);
  assertEquals(result.value, {
    package: '@netscript/fresh',
    total: 3,
    returned: 2,
    offset: 0,
    groups: [{
      subpath: './builders',
      total: 3,
      symbols: [
        { name: 'definePage', kind: 'function' },
        { name: 'definePartial', kind: 'function' },
      ],
    }],
    nextOffset: 2,
    truncated: true,
  });
});

Deno.test('get_export refuses ambiguity and returns only one bounded signature and JSDoc', async () => {
  const ambiguous = await flows.get_export({ symbol: 'definePage' });
  assert(!ambiguous.ok);
  assertEquals(ambiguous.error.code, 'export_ambiguous');
  assertMatch(ambiguous.error.message, /Specify package and subpath/);

  const exact = await flows.get_export({
    symbol: 'definePage',
    package: '@netscript/fresh',
    subpath: './builders',
  });
  assert(exact.ok);
  assertEquals(exact.value, {
    package: '@netscript/fresh',
    subpath: './builders',
    symbol: 'definePage',
    kind: 'function',
    signature: 'function definePage<TState = EmptyRecord>(): PageRootBuilder<TState>',
    jsDoc: 'Start a new typed page builder chain.',
    truncated: false,
  });

  const longCorpus: ExportSurfaceCorpusPort = {
    load: () =>
      Promise.resolve({
        ...EXPORT_SURFACE_FIXTURE,
        entries: [{
          ...EXPORT_SURFACE_FIXTURE.entries[1]!,
          jsDoc: 'x'.repeat(EXPORT_JSDOC_CHARACTER_LIMIT + 100),
        }],
      }),
  };
  const bounded = await createExportSurfaceFlows(longCorpus).get_export({ symbol: 'definePage' });
  assert(bounded.ok);
  assertEquals((bounded.value as { jsDoc: string }).jsDoc.length, EXPORT_JSDOC_CHARACTER_LIMIT);
  assertEquals((bounded.value as { truncated: boolean }).truncated, true);
});

Deno.test('search_exports ranks the specific helper below a general helper by partial shape', async () => {
  const result = await flows.search_exports({ query: 'stats partial' });
  assert(result.ok);
  const value = result.value as {
    total: number;
    matches: Array<{ symbol: string; score: number }>;
    truncated: boolean;
  };
  assertEquals(value.total, 1);
  assertEquals(value.matches[0]?.symbol, 'defineStatsPartial');
  assertEquals(value.matches[0]?.score, 60);
  assertEquals(value.truncated, false);
});
