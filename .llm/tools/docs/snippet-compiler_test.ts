import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join } from '@std/path';
import { compileSnippetAnalysis } from './snippet-compiler.ts';
import { analyzeSnippetSite } from './snippet-policy.ts';
import { canonicalizePackageSpecifier, resolveWorkspaceSurface } from './snippet-workspace.ts';
import { checkReadmeFences } from './check-readme-fences.ts';
import { readmeFenceRatchetFailures } from './readme-fence-policy.ts';
import type { SnippetProcessResult } from './snippet-process.ts';

const repositoryRoot = dirname(dirname(dirname(dirname(fromFileUrl(import.meta.url)))));
const fixtureRoot = join(repositoryRoot, '.llm/tools/docs/fixtures');

async function compileFixture(name: string) {
  const analysis = await analyzeSnippetSite(join(fixtureRoot, name, 'docs/site'), {
    enforceCoverage: false,
  });
  return await compileSnippetAnalysis(analysis, repositoryRoot);
}

Deno.test('workspace resolver exposes exact exports, catalog fallbacks, and canonical ranges', async () => {
  const surface = await resolveWorkspaceSurface(repositoryRoot);
  assertEquals(surface.memberCount, 37);
  assertEquals(Object.keys(surface.catalog).length, 38);
  assert(surface.imports['@netscript/sdk/client'].endsWith('/packages/sdk/src/client/mod.ts'));
  assertEquals(surface.imports['@netscript/sdk/src/client/mod.ts'], undefined);
  assertEquals(surface.imports['@opentelemetry/api'], 'npm:@opentelemetry/api@^1.9.1');
  assertEquals(canonicalizePackageSpecifier('jsr:@std/assert@1'), 'jsr:@std/assert@^1');
  assertEquals(
    canonicalizePackageSpecifier('jsr:@std/assert@^1'),
    canonicalizePackageSpecifier('jsr:@std/assert@1'),
  );
  assertEquals(surface.declaredConflictCount, 0);
  assertEquals(surface.catalogConflictCount, 0);
});

Deno.test('copied-lock compiler is green with root catalog and leaves tracked lock unchanged', async () => {
  const lockBefore = await Deno.readTextFile(join(repositoryRoot, 'deno.lock'));
  const result = await compileFixture('dialect-a-positional');
  assertEquals(result.code, 0, result.diagnostics);
  assertEquals(result.catalogCount, 38);
  assertEquals(result.memberCount, 37);
  assert(result.rootLockUnchanged);
  assert(result.temporaryLockRewritten);
  assertEquals(await Deno.readTextFile(join(repositoryRoot, 'deno.lock')), lockBefore);
});

Deno.test('actual compiler graph rejects a non-exported SDK symbol', async () => {
  const result = await compileFixture('non-exported-symbol');
  assertEquals(result.code, 1);
  assertStringIncludes(result.diagnostics, 'page.md:1');
  assertStringIncludes(result.diagnostics, 'DefinitelyNotExportedByNetScript');
});

Deno.test('compiler reports later fence errors after an earlier tolerated failure', async () => {
  const site = await Deno.makeTempDir({ prefix: 'snippet-all-failures-' });
  const forceColor = Deno.env.get('FORCE_COLOR');
  const noColor = Deno.env.get('NO_COLOR');
  try {
    // CI colorizes locations; exercise the same output even in a non-interactive local run.
    Deno.env.set('FORCE_COLOR', '1');
    Deno.env.delete('NO_COLOR');
    await Deno.writeTextFile(
      join(site, 'page.md'),
      '```ts\nconst firstFailure: string = 1;\n```\n\n' +
        '```ts\nconst laterFailure: number = "wrong";\n```\n',
    );
    const analysis = await analyzeSnippetSite(site, { enforceCoverage: false });
    const result = await compileSnippetAnalysis(analysis, repositoryRoot);
    assertEquals(result.code, 1);
    assertStringIncludes(result.diagnostics, 'firstFailure');
    assertStringIncludes(result.diagnostics, 'laterFailure');
    assertStringIncludes(result.diagnostics, 'page.md:6:');
  } finally {
    if (forceColor === undefined) Deno.env.delete('FORCE_COLOR');
    else Deno.env.set('FORCE_COLOR', forceColor);
    if (noColor === undefined) Deno.env.delete('NO_COLOR');
    else Deno.env.set('NO_COLOR', noColor);
    await Deno.remove(site, { recursive: true });
  }
});

Deno.test('README module-graph failures cannot borrow the known type-error allowance', async () => {
  const root = await Deno.makeTempDir({ prefix: 'readme-graph-failure-' });
  try {
    await Deno.mkdir(join(root, 'packages/example'), { recursive: true });
    await Deno.copyFile(
      join(fixtureRoot, 'unknown-export/README.md'),
      join(root, 'packages/example/README.md'),
    );
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({ workspace: [], catalog: { preact: '^10.29.2' } }),
    );
    await Deno.copyFile(join(repositoryRoot, 'deno.lock'), join(root, 'deno.lock'));
    const result = await checkReadmeFences(root);
    assertStringIncludes(result.diagnostics, 'Unknown export');
    assertEquals(result.census.unattributedFailure, true, result.diagnostics);
    assert(
      readmeFenceRatchetFailures(result.census).includes(
        'compiler reported failure that no fence accounts for',
      ),
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

for (const outcome of ['success', 'type-error', 'timeout', 'interruption'] as const) {
  Deno.test(`corpus compiler uses one process, diagnostic fallback only on timeout: ${outcome}`, async () => {
    const site = await Deno.makeTempDir({ prefix: 'snippet-corpus-' });
    try {
      await Deno.writeTextFile(
        join(site, 'page.md'),
        '```ts\nexport {};\n```\n\n```ts\nexport {};\n```\n',
      );
      const analysis = await analyzeSnippetSite(site, { enforceCoverage: false });
      const calls: string[][] = [];
      const result = await compileSnippetAnalysis(analysis, repositoryRoot, {
        processRunner: (_command, args, options): Promise<SnippetProcessResult> => {
          calls.push(args);
          const timedOut = outcome === 'timeout' && calls.length !== 2;
          const interrupted = outcome === 'interruption';
          return Promise.resolve({
            code: outcome === 'success' || (outcome === 'timeout' && calls.length === 2) ? 0 : 1,
            timedOut,
            interrupted,
            stdout: '',
            stderr: timedOut ? `${options.source}: timed out` : 'compiler output\n',
          });
        },
      });
      const firstPaths = calls[0].filter((arg) => arg.endsWith('.ts'));
      assertEquals(firstPaths.length, 2, 'all corpus entrypoints belong to one check');
      assertEquals(calls.length, outcome === 'timeout' ? 3 : 1);
      assertEquals(result.code, outcome === 'success' ? 0 : 1);
      assertEquals(result.incomplete, outcome === 'timeout' || outcome === 'interruption');
      assertEquals(result.diagnostics.match(/source fences:/g)?.length, 1);
      if (outcome === 'timeout') {
        assertEquals(
          calls.slice(1).map((args) => args.filter((arg) => arg.endsWith('.ts')).length),
          [1, 1],
        );
        assertStringIncludes(result.diagnostics, 'page.md:5: timed out');
      }
    } finally {
      await Deno.remove(site, { recursive: true });
    }
  });
}

Deno.test('compiler deadline fails with the source fence and preserves the tracked lock', async () => {
  const lockBefore = await Deno.readTextFile(join(repositoryRoot, 'deno.lock'));
  const analysis = await analyzeSnippetSite(join(fixtureRoot, 'never-exits/docs/site'), {
    enforceCoverage: false,
  });
  const result = await compileSnippetAnalysis(analysis, repositoryRoot, { timeoutMs: 1 });
  assertEquals(result.code, 1);
  assertStringIncludes(result.diagnostics, 'page.md:3: snippet process timed out after 1ms');
  assert(result.incomplete);
  assert(result.rootLockUnchanged);
  assertEquals(await Deno.readTextFile(join(repositoryRoot, 'deno.lock')), lockBefore);
});

Deno.test('dialect controls discriminate typed APIs through the same docs fixture', async () => {
  const red = await compileFixture('dialect-a-object-input');
  assertEquals(red.code, 1);
  assertStringIncludes(red.diagnostics, 'page.md:1');
  assertStringIncludes(red.diagnostics, 'TS2353');

  const greenA = await compileFixture('dialect-a-positional');
  assertEquals(greenA.code, 0, greenA.diagnostics);
  const greenB = await compileFixture('dialect-b-object-input');
  assertEquals(greenB.code, 0, greenB.diagnostics);
});
