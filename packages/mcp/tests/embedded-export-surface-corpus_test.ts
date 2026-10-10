import { assertEquals, assertRejects } from '@std/assert';
import {
  createExportSurfaceFlows,
  EmbeddedExportSurfaceCorpus,
  type EmbeddedExportSurfaceSource,
} from '../mod.ts';
import {
  EXPORT_SURFACE_FRAMEWORK_VERSION,
  EXPORT_SURFACE_ROWS,
} from '../src/infrastructure/export-surfaces/export-surface-corpus.generated.ts';

Deno.test('embedded export corpus verifies pinned version, hash, sizes, and exact counts', async () => {
  const corpus = await new EmbeddedExportSurfaceCorpus().load();
  assertEquals(corpus.frameworkVersion, EXPORT_SURFACE_FRAMEWORK_VERSION);
  assertEquals(corpus.surfaces.length, EXPORT_SURFACE_ROWS.length);
  assertEquals(corpus.entries.length, EXPORT_SURFACE_ROWS.reduce((sum, row) => sum + row[5], 0));
  assertEquals(
    new Set(corpus.surfaces.map((surface) => surface.packageName)).size,
    new Set(EXPORT_SURFACE_ROWS.map((row) => row[0])).size,
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
  // The legacy source override stays supported and continues to reject transport corruption.
  const fixture = await import('./fixtures/export-surfaces/corpus.fixture.ts');
  const bytes = new TextEncoder().encode(JSON.stringify(fixture.EXPORT_SURFACE_FIXTURE));
  const gzip = new Uint8Array(
    await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')))
      .arrayBuffer(),
  );
  const source: EmbeddedExportSurfaceSource = {
    gzipBase64: gzip.toBase64(),
    provenance: {
      schemaVersion: 1,
      frameworkVersion: fixture.EXPORT_SURFACE_FIXTURE.frameworkVersion,
      sha256: new Uint8Array(await crypto.subtle.digest('SHA-256', gzip)).toHex(),
      compressedBytes: gzip.byteLength,
      uncompressedBytes: bytes.byteLength,
      packageCount: 3,
      subpathCount: 3,
      symbolCount: fixture.EXPORT_SURFACE_FIXTURE.entries.length,
    },
  };
  const corruptedSource: EmbeddedExportSurfaceSource = {
    ...source,
    gzipBase64: `${source.gzipBase64[0] === 'A' ? 'B' : 'A'}${source.gzipBase64.slice(1)}`,
  };
  await assertRejects(
    () =>
      new EmbeddedExportSurfaceCorpus({
        source: corruptedSource,
        expectedFrameworkVersion: source.provenance.frameworkVersion,
      }).load(),
    Error,
    'hash does not match',
  );
  await assertRejects(
    () =>
      new EmbeddedExportSurfaceCorpus({
        expectedFrameworkVersion: `${EXPORT_SURFACE_FRAMEWORK_VERSION}-drift`,
      }).load(),
    Error,
    'does not match',
  );
  for (const row of EXPORT_SURFACE_ROWS) assertEquals(Uint8Array.fromBase64(row[3]).byteLength, 32);
});
