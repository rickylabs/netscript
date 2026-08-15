import {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { join } from '@std/path';
import {
  type ComparisonManifest,
  countText,
  measureComparisonSurface,
  parseManifest,
  type RootVerifier,
  serializeMeasurement,
  sha256Hex,
  TOOL_VERSION,
} from './measure-comparison-surface.ts';

const encoder = new TextEncoder();

async function fixtureRepository(): Promise<{
  root: string;
  revision: string;
  content: string;
  hash: string;
}> {
  const root = await Deno.makeTempDir({ prefix: 'comparison-measurement-' });
  const content = [
    '// synthetic comment',
    'const PRIVATE_FIXTURE_SECRET = 42;',
    '/* block',
    ' * continuation',
    ' */',
    '',
  ].join('\n');
  await Deno.writeTextFile(join(root, 'surface.ts'), content);
  return {
    root,
    revision: '1'.repeat(40),
    content,
    hash: await sha256Hex(encoder.encode(content)),
  };
}

function verifier(revision: string): RootVerifier {
  return {
    revision: () => Promise.resolve(revision),
    clean: () => Promise.resolve(true),
  };
}

function manifest(revision: string, hash: string, path = 'surface.ts'): ComparisonManifest {
  return parseManifest({
    schemaVersion: 1,
    caseId: 'synthetic-session',
    toolVersion: TOOL_VERSION,
    frameworkVersions: {
      fresh: '^2.3.3',
      netscript: '0.0.6',
      nextjs: '16.3.0',
    },
    featureFlags: {
      'nextjs.cacheComponents': 'deferred-no-implementation',
    },
    inspectedAt: '2026-08-15',
    measurementPolicy: {
      physicalLines: 'synthetic policy',
      nonblankLines: 'synthetic policy',
      commentLines: 'synthetic policy',
      tokens: 'synthetic policy',
      includedTotals: 'synthetic policy',
      timestampField: '/observedAt',
    },
    reproduction: {
      precondition: 'synthetic precondition',
      command: 'synthetic command',
      privateSourcePolicy: 'synthetic policy',
    },
    sources: [{
      id: 'fixture',
      repository: 'local-synthetic',
      revision,
      access: 'authorized-private-local-checkout-required',
      requireClean: true,
      files: [{ path, classification: 'framework-glue', sha256: hash }],
    }],
    unmatchedSources: [{
      id: 'other',
      framework: 'Other',
      version: '1.0.0',
      status: 'absent',
      reason: 'No fixture root is present.',
      measurements: {
        physicalLines: { status: 'deferred', owner: 'issue:test' },
        nonblankLines: { status: 'deferred', owner: 'issue:test' },
        commentLines: { status: 'deferred', owner: 'issue:test' },
        tokens: { status: 'deferred', owner: 'issue:test' },
      },
    }],
  });
}

Deno.test('countText follows the documented deterministic line and token policy', () => {
  const counts = countText('// one\r\nconst value = 1; // inline\r\n/* block\r\nend */\r\n\r\n');
  assertEquals(counts, {
    physicalLines: 5,
    nonblankLines: 4,
    commentLines: 3,
    tokens: 17,
  });
});

Deno.test('measurement is stable except for observedAt and never emits source contents', async () => {
  const fixture = await fixtureRepository();
  try {
    const parsed = manifest(fixture.revision, fixture.hash);
    const roots = new Map([['fixture', fixture.root]]);
    const first = await measureComparisonSurface(
      parsed,
      roots,
      '2026-08-15T10:00:00Z',
      verifier(fixture.revision),
    );
    const second = await measureComparisonSurface(
      parsed,
      roots,
      '2026-08-15T11:00:00Z',
      verifier(fixture.revision),
    );
    const firstStable = structuredClone(first) as unknown as Record<string, unknown>;
    const secondStable = structuredClone(second) as unknown as Record<string, unknown>;
    delete firstStable.observedAt;
    delete secondStable.observedAt;
    assertEquals(firstStable, secondStable);

    assertEquals(first.sources[0].includedTotals.fileCount, 1);
    assertEquals(first.unmatchedSources[0].status, 'absent');
    assertEquals(first.unmatchedSources[0].measurements.tokens.status, 'deferred');
    assertEquals(first.frameworkVersions, {
      fresh: '^2.3.3',
      netscript: '0.0.6',
      nextjs: '16.3.0',
    });
    assertEquals(first.featureFlags, {
      'nextjs.cacheComponents': 'deferred-no-implementation',
    });
    assertEquals(first.inspectedAt, '2026-08-15');
    const serialized = serializeMeasurement(first);
    assert(!serialized.includes('PRIVATE_FIXTURE_SECRET'));
    assert(!serialized.includes(fixture.content));
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test('revision mismatch is refused before any manifest file read', async () => {
  const fixture = await fixtureRepository();
  try {
    const parsed = manifest('0'.repeat(40), '0'.repeat(64), 'missing.ts');
    const error = await assertRejects(
      () =>
        measureComparisonSurface(
          parsed,
          new Map([['fixture', fixture.root]]),
          '2026-08-15T10:00:00Z',
          verifier(fixture.revision),
        ),
      Error,
      'Revision mismatch',
    );
    assert(!error.message.includes('Missing source file'));
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test('missing and hash-mismatched files are refused without source text', async () => {
  const fixture = await fixtureRepository();
  try {
    await assertRejects(
      () =>
        measureComparisonSurface(
          manifest(fixture.revision, '0'.repeat(64), 'missing.ts'),
          new Map([['fixture', fixture.root]]),
          '2026-08-15T10:00:00Z',
          verifier(fixture.revision),
        ),
      Error,
      'Missing source file fixture:missing.ts',
    );
    const error = await assertRejects(
      () =>
        measureComparisonSurface(
          manifest(fixture.revision, '0'.repeat(64)),
          new Map([['fixture', fixture.root]]),
          '2026-08-15T10:00:00Z',
          verifier(fixture.revision),
        ),
      Error,
      'Hash mismatch',
    );
    assert(!error.message.includes('PRIVATE_FIXTURE_SECRET'));
  } finally {
    await Deno.remove(fixture.root, { recursive: true });
  }
});

Deno.test('manifest rejects unsafe paths and estimated unmatched values', () => {
  const base = {
    schemaVersion: 1,
    caseId: 'synthetic-session',
    toolVersion: TOOL_VERSION,
    frameworkVersions: {
      fresh: '^2.3.3',
      netscript: '0.0.6',
      nextjs: '16.3.0',
    },
    featureFlags: {
      'nextjs.cacheComponents': 'deferred-no-implementation',
    },
    inspectedAt: '2026-08-15',
    measurementPolicy: {
      physicalLines: 'policy',
      nonblankLines: 'policy',
      commentLines: 'policy',
      tokens: 'policy',
      includedTotals: 'policy',
      timestampField: '/observedAt',
    },
    reproduction: {
      precondition: 'precondition',
      command: 'command',
      privateSourcePolicy: 'policy',
    },
    sources: [{
      id: 'fixture',
      repository: 'local',
      revision: '0'.repeat(40),
      access: 'authorized-private-local-checkout-required',
      requireClean: true,
      files: [{
        path: '../outside.ts',
        classification: 'framework-glue',
        sha256: '0'.repeat(64),
      }],
    }],
    unmatchedSources: [{
      id: 'other',
      framework: 'Other',
      version: '1',
      status: 'absent',
      reason: 'absent',
      measurements: {
        physicalLines: { status: 'deferred', owner: 'issue:test' },
        nonblankLines: { status: 'deferred', owner: 'issue:test' },
        commentLines: { status: 'deferred', owner: 'issue:test' },
        tokens: { status: 'deferred', owner: 'issue:test' },
      },
    }],
  };
  assertThrows(() => parseManifest(base), Error, 'unsafe path segment');

  const estimated = structuredClone(base);
  estimated.sources[0].files[0].path = 'surface.ts';
  estimated.unmatchedSources[0].measurements.tokens = {
    status: 'estimated',
    owner: 'issue:test',
  } as never;
  try {
    parseManifest(estimated);
    throw new Error('expected estimated value to be rejected');
  } catch (error) {
    assertStringIncludes((error as Error).message, 'must be "deferred"');
  }
});
