import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join } from '@std/path';
import { extractFencedBlocks } from './snippet-extractor.ts';
import { analyzeSnippetSite } from './snippet-policy.ts';
import { runSnippetProcess } from './snippet-process.ts';
import { resolveWorkspaceSurface } from './snippet-workspace.ts';

const repositoryRoot = dirname(dirname(dirname(dirname(fromFileUrl(import.meta.url)))));
const commandPage = 'services-sdk/commands.md';

Deno.test('command guide executes atomicity and replay assertions as a public consumer', async () => {
  const source = await Deno.readTextFile(join(repositoryRoot, 'docs/site', commandPage));
  const example = extractFencedBlocks(source, commandPage).find((block) => block.checkedLanguage);
  assert(example, 'the executable command example must exist');
  assertEquals(example.exemptionReason, undefined);
  const imports = [...example.body.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
  assert(imports.length > 0);
  assert(imports.every((specifier) => specifier.startsWith('@') || specifier === 'zod'));
  assert(imports.every((specifier) => !specifier.includes('/src/')));

  const lockPath = join(repositoryRoot, 'deno.lock');
  const lockBefore = await Deno.readTextFile(lockPath);
  const consumer = await Deno.makeTempDir({ prefix: 'command-guide-consumer-' });
  try {
    const surface = await resolveWorkspaceSurface(repositoryRoot, {}, { publishedOnly: true });
    for (const specifier of imports) assert(specifier in surface.imports, specifier);
    await Deno.writeTextFile(
      join(consumer, 'deno.json'),
      JSON.stringify({
        compilerOptions: { strict: true, isolatedDeclarations: false },
        imports: surface.imports,
        catalog: surface.catalog,
      }),
    );
    await Deno.writeTextFile(join(consumer, 'counter.ts'), example.body);
    await Deno.copyFile(lockPath, join(consumer, 'deno.lock'));
    const result = await runSnippetProcess(Deno.execPath(), [
      'run',
      '--unstable-kv',
      '--config',
      join(consumer, 'deno.json'),
      '--lock',
      join(consumer, 'deno.lock'),
      join(consumer, 'counter.ts'),
    ], { cwd: consumer, source: commandPage });
    assertEquals(result.timedOut, false);
    assertEquals(result.interrupted, false);
    assertEquals(result.code, 0, result.stderr);
    assertStringIncludes(
      result.stdout,
      'command guide: atomic commit, replay, conflict, mismatch and rollback passed',
    );
  } finally {
    await Deno.remove(consumer, { recursive: true });
    assertEquals(await Deno.readTextFile(lockPath), lockBefore);
  }
});

Deno.test('all command and relay guide fences are checked with no exemptions', async () => {
  const analysis = await analyzeSnippetSite(join(repositoryRoot, 'docs/site'));
  for (
    const page of [
      commandPage,
      'services-sdk/command-relay.md',
      'services-sdk/command-operations.md',
      'services-sdk/command-security.md',
      'services-sdk/command-compatibility.md',
      'orchestration-runtime/how-to/outbound-webhooks.md',
    ]
  ) {
    const candidates = analysis.blocks.filter((block) =>
      block.sourcePath === page && block.checkedLanguage !== undefined
    );
    assert(candidates.length > 0, `${page} must retain a checked example`);
    for (const block of candidates) {
      assertEquals(block.exemptionReason, undefined, page);
      assert(analysis.tier1Blocks.includes(block), `${page} fence must be Tier-1`);
    }
  }
});
