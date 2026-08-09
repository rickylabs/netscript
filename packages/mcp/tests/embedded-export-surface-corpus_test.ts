import { assertEquals, assertMatch, assertRejects } from '@std/assert';
import {
  createExportSurfaceFlows,
  EmbeddedExportSurfaceCorpus,
  type EmbeddedExportSurfaceSource,
} from '../mod.ts';
import {
  EXPORT_SURFACE_CORPUS_GZIP_BASE64,
  EXPORT_SURFACE_CORPUS_PROVENANCE,
} from '../src/infrastructure/export-surfaces/export-surface-corpus.generated.ts';

Deno.test('embedded export corpus verifies pinned version, hash, sizes, and exact counts', async () => {
  const corpus = await new EmbeddedExportSurfaceCorpus().load();
  assertEquals(corpus.frameworkVersion, EXPORT_SURFACE_CORPUS_PROVENANCE.frameworkVersion);
  assertEquals(corpus.surfaces.length, EXPORT_SURFACE_CORPUS_PROVENANCE.subpathCount);
  assertEquals(corpus.entries.length, EXPORT_SURFACE_CORPUS_PROVENANCE.symbolCount);
  assertEquals(
    new Set(corpus.surfaces.map((surface) => surface.packageName)).size,
    EXPORT_SURFACE_CORPUS_PROVENANCE.packageCount,
  );

  const exact = await createExportSurfaceFlows(new EmbeddedExportSurfaceCorpus()).get_export({
    symbol: 'definePage',
    package: '@netscript/fresh',
    subpath: './builders',
  });
  assertEquals(exact, {
    ok: true,
    value: {
      package: '@netscript/fresh',
      subpath: './builders',
      symbol: 'definePage',
      kind: 'function',
      signature: 'function definePage<TState = EmptyRecord>(): PageRootBuilder<TState>',
      jsDoc: 'Start a new typed page builder chain.',
      truncated: false,
    },
  });
});

Deno.test('embedded export corpus rejects corrupted bytes and version drift', async () => {
  const corruptedSource: EmbeddedExportSurfaceSource = {
    gzipBase64: `${EXPORT_SURFACE_CORPUS_GZIP_BASE64[0] === 'A' ? 'B' : 'A'}${
      EXPORT_SURFACE_CORPUS_GZIP_BASE64.slice(1)
    }`,
    provenance: EXPORT_SURFACE_CORPUS_PROVENANCE,
  };
  await assertRejects(
    () => new EmbeddedExportSurfaceCorpus({ source: corruptedSource }).load(),
    Error,
    'hash does not match',
  );
  await assertRejects(
    () =>
      new EmbeddedExportSurfaceCorpus({
        expectedFrameworkVersion: `${EXPORT_SURFACE_CORPUS_PROVENANCE.frameworkVersion}-drift`,
      }).load(),
    Error,
    'does not match',
  );
  assertMatch(EXPORT_SURFACE_CORPUS_PROVENANCE.sha256, /^[a-f0-9]{64}$/);
});
