import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join } from '@std/path';
import { compileSnippetAnalysis } from './snippet-compiler.ts';
import { analyzeSnippetSite } from './snippet-policy.ts';
import { canonicalizePackageSpecifier, resolveWorkspaceSurface } from './snippet-workspace.ts';

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
