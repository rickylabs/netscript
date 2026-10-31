import {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
  assertThrows,
} from '@std/assert';
import { checkCliExamples } from './cli-example-policy.ts';
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

Deno.test('CLI examples reject package update operands in fences, inline code and HTML tables', () => {
  for (
    const operand of [
      '@netscript/plugin-workers',
      'jsr:@netscript/plugin-workers@0.0.8',
      '"@acme/plugin-example"',
      "'jsr:@acme/plugin-example'",
      '&quot;@netscript/plugin-workers&quot;',
      '&#39;@netscript/plugin-workers&#39;',
      '<pkg>',
      '&lt;pkg&gt;',
      '<package>',
      '&lt;specifier&gt;',
    ]
  ) {
    for (
      const source of [
        `# Guide\n\n\`\`\`sh\nnetscript plugin update ${operand}\n\`\`\`\n`,
        `# Guide\nUse \`netscript plugin update ${operand}\`.\n`,
        `# Guide\n["<code>netscript plugin update ${operand}</code>", "Update a plugin"]\n`,
        `# Guide\nnetscript plugin\n  update\n  ${operand}\n`,
      ]
    ) {
      const error = assertThrows(() => checkCliExamples(source, 'guide.md'), Error);
      assertStringIncludes(error.message, 'guide.md:');
      assertStringIncludes(error.message, 'plugin update requires an installed plugin name');
    }
  }
});

Deno.test('CLI example policy preserves installed names and other verbs and reports source lines', () => {
  checkCliExamples(
    [
      'netscript plugin update workers',
      'netscript plugin update custom-name --project-root .',
      'netscript plugin update <name>',
      'netscript plugin update &lt;name&gt;',
      'netscript plugin update --help',
      'netscript plugin install worker --name workers --jsr-url @netscript/plugin-workers',
      'netscript plugin enable @acme/plugin-example',
      'netscript plugin setup jsr:@acme/plugin-example',
    ].join('\n'),
    'commands.md',
  );
  assertThrows(
    () =>
      checkCliExamples(
        '# Guide\r\n\r\n<code>netscript plugin update @netscript/plugin-workers</code>',
        'guide.md',
      ),
    Error,
    'guide.md:3: plugin update requires an installed plugin name',
  );
});

Deno.test('site analysis guards CLI examples outside the TypeScript coverage floor', async () => {
  const site = await Deno.makeTempDir({ prefix: 'plugin-update-docs-' });
  try {
    for (const file of ['guide.md', 'guide.vto']) {
      const path = join(site, file);
      await Deno.writeTextFile(
        path,
        '<code>netscript plugin update @netscript/plugin-workers</code>\n',
      );
      await assertRejects(
        () => analyzeSnippetSite(site, { enforceCoverage: false }),
        Error,
        `${file}:1: plugin update requires an installed plugin name`,
      );
      await Deno.writeTextFile(path, '<code>netscript plugin update workers</code>\n');
      assertEquals((await analyzeSnippetSite(site, { enforceCoverage: false })).census.scanned, 0);
    }
  } finally {
    await Deno.remove(site, { recursive: true });
  }
});

Deno.test('package-specifier negative fixture exits the actual snippets CLI non-zero', async () => {
  const output = await new Deno.Command(Deno.execPath(), {
    cwd: repositoryRoot,
    args: ['task', 'docs:snippets:negative', 'plugin-update-package-specifier'],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(output.code, 1);
  assertStringIncludes(
    new TextDecoder().decode(output.stderr),
    'page.md:4: plugin update requires an installed plugin name',
  );
});
