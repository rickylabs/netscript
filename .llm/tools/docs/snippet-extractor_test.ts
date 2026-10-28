import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { dirname, fromFileUrl, join } from '@std/path';
import { extractFencedBlocks } from './snippet-extractor.ts';
import { analyzeSnippetSite } from './snippet-policy.ts';
import { kill } from 'node:process';

const repositoryRoot = dirname(dirname(dirname(dirname(fromFileUrl(import.meta.url)))));

Deno.test({
  name: 'interrupted Git ignore probe aborts the source walk',
  ignore: Deno.build.os === 'windows',
  fn: async () => {
    const temp = await Deno.makeTempDir({ prefix: 'snippet-walk-interruption-' });
    const ready = join(temp, 'ready');
    const bin = join(temp, 'bin');
    const site = join(temp, 'site');
    await Deno.mkdir(bin);
    await Deno.mkdir(join(site, 'article'), { recursive: true });
    await Deno.writeTextFile(join(site, 'article/page.md'), '```ts\nconst value = 1;\n```\n');
    const git = join(bin, 'git');
    await Deno.writeTextFile(
      git,
      '#!/usr/bin/env -S deno run --no-config --allow-write\n' +
        `await Deno.writeTextFile(${JSON.stringify(ready)}, String(Deno.pid));\n` +
        'setInterval(() => {}, 1_000);\n',
    );
    await Deno.chmod(git, 0o755);
    const policyUrl = new URL('./snippet-policy.ts', import.meta.url).href;
    const child = new Deno.Command(Deno.execPath(), {
      args: [
        'eval',
        `import { analyzeSnippetSite } from ${JSON.stringify(policyUrl)};
          await analyzeSnippetSite(${JSON.stringify(site)}, { enforceCoverage: false });`,
      ],
      env: { PATH: `${bin}:${Deno.env.get('PATH') ?? ''}` },
      stdin: 'null',
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    const output = child.output();
    const guard = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch { /* Already exited. */ }
    }, 5_000);
    let probePid: number | undefined;
    try {
      const until = performance.now() + 2_000;
      while (performance.now() < until) {
        try {
          probePid = Number(await Deno.readTextFile(ready));
          break;
        } catch (error) {
          if (!(error instanceof Deno.errors.NotFound)) throw error;
          await new Promise((done) => setTimeout(done, 20));
        }
      }
      assert(probePid, 'the ignore probe must be active before cancellation');
      child.kill('SIGTERM');
      const result = await output;
      assertEquals(result.success, false, 'an interrupted probe must not resume source scanning');
      assertStringIncludes(new TextDecoder().decode(result.stderr), 'snippet process interrupted');
    } finally {
      clearTimeout(guard);
      if (probePid) {
        try {
          kill(-probePid, 'SIGKILL');
        } catch { /* The owned probe was already terminated. */ }
      }
      try {
        child.kill('SIGKILL');
      } catch { /* Already exited. */ }
      await output;
      await Deno.remove(temp, { recursive: true });
    }
  },
});

Deno.test('extractor preserves provenance and treats typescript as checked ts', () => {
  const blocks = extractFencedBlocks(
    '# Example\n\n~~~typescript\nconst answer = 42;\n~~~\n\n```tsx no-check: partial JSX\n<div />\n```\n',
    'guide.md',
  );
  assertEquals(blocks, [
    {
      sourcePath: 'guide.md',
      fenceOrdinal: 1,
      openingLine: 3,
      codeStartLine: 4,
      closingLine: 5,
      delimiter: '~',
      delimiterLength: 3,
      infoString: 'typescript',
      language: 'typescript',
      checkedLanguage: 'typescript',
      compilationExtension: 'ts',
      body: 'const answer = 42;',
    },
    {
      sourcePath: 'guide.md',
      fenceOrdinal: 2,
      openingLine: 7,
      codeStartLine: 8,
      closingLine: 9,
      delimiter: '`',
      delimiterLength: 3,
      infoString: 'tsx no-check: partial JSX',
      language: 'tsx',
      checkedLanguage: 'tsx',
      compilationExtension: 'tsx',
      exemptionReason: 'partial JSX',
      body: '<div />',
    },
  ]);
});

Deno.test('recognized TS fences reject missing reasons and extra attributes', () => {
  for (const info of ['ts no-check', 'ts no-check:', 'tsx twoslash']) {
    let message = '';
    try {
      extractFencedBlocks(`\`\`\`${info}\nconst x = 1;\n\`\`\`\n`, 'bad.md');
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    assertStringIncludes(message, 'bad.md:1: malformed');
  }
});

Deno.test('real corpus census recognizes TS aliases and enforces Tier-1 invariants', async () => {
  const analysis = await analyzeSnippetSite(join(repositoryRoot, 'docs/site'));
  const { census } = analysis;

  assert(census.ts > 0, 'expected at least one ts fence');
  assert(census.tsx > 0, 'expected at least one tsx fence');
  assert(census.typescript > 0, 'expected at least one typescript fence');
  assertEquals(census.tsLike, census.ts + census.tsx + census.typescript);
  assertEquals(census.tier1 + census.outsideFloor, census.tsLike);
  assertEquals(census.checked + census.exempt, census.tier1);
  assert(census.tier1 >= 35, `candidate count ${census.tier1} is below floor 35`);
  assert(census.checked >= 21, `checked count ${census.checked} is below floor 21`);
  assert(census.exempt <= 14, `exemption count ${census.exempt} exceeds budget 14`);
  assertEquals(census.malformed, 0);

  const temp = await Deno.makeTempDir();
  try {
    const site = join(temp, 'docs/site');
    for (
      const page of [
        'quickstart.vto',
        'index.vto',
        'services-sdk/sdk.md',
        'services-sdk/how-to/add-a-service.md',
        'web-layer/query.md',
        'web-layer/examples.md',
        'web-layer/interactive.md',
        'web-layer/form.md',
        'web-layer/query-bridge.md',
      ]
    ) {
      const target = join(site, page);
      await Deno.mkdir(dirname(target), { recursive: true });
      await Deno.writeTextFile(
        target,
        page === 'quickstart.vto' ? '```js\nconst bypass = true;\n```\n' : '',
      );
    }
    await assertRejects(
      () => analyzeSnippetSite(site),
      Error,
      'candidate count 0 is below floor 35',
    );

    const quickstart = join(site, 'quickstart.vto');
    await Deno.writeTextFile(
      quickstart,
      `${'```ts no-check:structural fragment\nvalue;\n```\n'.repeat(15)}${
        '```ts\nconst value = 1;\n```\n'.repeat(20)
      }`,
    );
    await assertRejects(
      () => analyzeSnippetSite(site),
      Error,
      'checked count 20 is below floor 21',
    );

    await Deno.writeTextFile(
      quickstart,
      `${'```ts no-check:structural fragment\nvalue;\n```\n'.repeat(15)}${
        '```ts\nconst value = 1;\n```\n'.repeat(21)
      }`,
    );
    await assertRejects(
      () => analyzeSnippetSite(site),
      Error,
      'exemption count 15 exceeds budget 14',
    );

    await Deno.writeTextFile(
      quickstart,
      '```typescript\nconst value = 1;\n```\n'.repeat(35),
    );
    assertEquals((await analyzeSnippetSite(site)).census.checked, 35);
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
});

Deno.test('empty-reason fixture exits the actual CLI non-zero and names its fence', async () => {
  const output = await new Deno.Command(Deno.execPath(), {
    cwd: repositoryRoot,
    args: [
      'run',
      '--allow-read',
      '--allow-write',
      '--allow-run',
      '--allow-env',
      '.llm/tools/docs/check-snippets.ts',
      '--negative',
      'empty-exemption-reason',
      '--extract-only',
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(output.code, 1);
  assertStringIncludes(new TextDecoder().decode(output.stderr), 'page.md:1: malformed ts fence');
});

Deno.test('negative task rejects missing and unknown fixture names with complete usage', async () => {
  for (
    const args of [
      ['task', 'docs:snippets:negative'],
      ['task', 'docs:snippets:negative', 'not-a-fixture'],
    ]
  ) {
    const output = await new Deno.Command(Deno.execPath(), {
      cwd: repositoryRoot,
      args,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stderr = new TextDecoder().decode(output.stderr);

    assertEquals(output.code, 1);
    assertStringIncludes(stderr, 'usage: deno task docs:snippets:negative <case>');
    for (
      const fixture of [
        'non-exported-symbol',
        'empty-exemption-reason',
        'dialect-a-object-input',
        'dialect-a-positional',
        'dialect-b-object-input',
      ]
    ) {
      assertStringIncludes(stderr, fixture);
    }
  }
});

Deno.test('site analysis excludes Lume build output without shrinking source coverage', async () => {
  const temp = await Deno.makeTempDir();
  const site = `${temp}/docs/site`;
  try {
    await Deno.mkdir(`${site}/_site`, { recursive: true });
    await Deno.writeTextFile(`${site}/page.md`, '```ts\nconst source = true;\n```\n');
    await Deno.writeTextFile(`${site}/_site/generated.md`, '```ts\nconst generated = true;\n');

    const analysis = await analyzeSnippetSite(site, { enforceCoverage: false });
    assertEquals(analysis.census.scanned, 1);
    assertEquals(analysis.blocks.map((block) => block.sourcePath), ['page.md']);
  } finally {
    await Deno.remove(temp, { recursive: true });
  }
});
