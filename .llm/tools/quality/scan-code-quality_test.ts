import { assertEquals, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import {
  type AllowanceIssueResolver,
  type AllowanceIssueState,
  createGitHubAllowanceIssueResolver,
  scanCodeQuality,
  scanCodeQualityDetailed,
} from './scan-code-quality.ts';

const OPEN_BACKLOG_OWNER: AllowanceIssueState = {
  issue: 1276,
  state: 'open',
  milestone: 'Backlog / Triage',
};

function allowanceResolver(
  states: ReadonlyMap<number, AllowanceIssueState | Error> = new Map([
    [1276, OPEN_BACKLOG_OWNER],
  ]),
  calls: number[] = [],
): AllowanceIssueResolver {
  return {
    resolve(issue: number): Promise<AllowanceIssueState> {
      calls.push(issue);
      const state = states.get(issue);
      if (state instanceof Error) return Promise.reject(state);
      if (!state) return Promise.reject(new Error(`missing fixture for #${issue}`));
      return Promise.resolve(state);
    },
  };
}

Deno.test('scanner reports every guarded quality rule and honors reasoned line allowances', async () => {
  const root = await Deno.makeTempDir();
  const host = join(root, 'packages/cli/src/public/features/plugins/host.ts');
  await Deno.mkdir(join(root, 'packages/cli/src/public/features/plugins'), { recursive: true });
  await Deno.writeTextFile(
    host,
    [
      '// deno-lint-ignore no-explicit-any',
      'type Value = Map<any, string>;',
      'const cast = value as unknown as Value;',
      "if (plugin.name === 'auth') return;",
      'const allowed: any = value; // quality-allow: #1276 — upstream untyped boundary',
    ].join('\n'),
  );
  const findings = await scanCodeQuality(['packages/cli/src'], root, {
    allowanceIssueResolver: allowanceResolver(),
  });
  assertEquals(findings.map((finding) => finding.rule), [
    'explicit-any-ignore',
    'explicit-any',
    'unsafe-cast',
    'plugin-name-check',
  ]);
});

Deno.test('scanner accepts exact changed files and ignores tests and generated sources', async () => {
  const root = await Deno.makeTempDir();
  await Deno.writeTextFile(join(root, 'clean.ts'), 'export const value: string = "ok";\n');
  await Deno.writeTextFile(join(root, 'ignored_test.ts'), 'const value: any = 1;\n');
  assertEquals(await scanCodeQuality(['clean.ts', 'ignored_test.ts'], root), []);
});

Deno.test('scanner catches evasion attempts: file-wide ignore, spaced casts, predicate name checks', async () => {
  const root = await Deno.makeTempDir();
  const dir = join(root, 'packages/cli/src/public/features/plugins');
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(
    join(dir, 'evade.ts'),
    [
      '// deno-lint-ignore-file no-explicit-any',
      'const a = value as   unknown   as Value;',
      "if (plugin.name.startsWith('auth')) return;",
      "if (kind.includes('ai')) enableMcp();",
      "const b = plugin.slug.endsWith('workers');",
    ].join('\n'),
  );
  const findings = await scanCodeQuality(['packages/cli/src'], root);
  const rules = findings.map((f) => f.rule);
  assertEquals(rules.includes('explicit-any-ignore'), true); // file-wide ignore
  assertEquals(rules.includes('unsafe-cast'), true); // irregular whitespace
  assertEquals(rules.filter((r) => r === 'plugin-name-check').length, 3); // startsWith/includes/endsWith
});

Deno.test('capability id containing a plugin name is NOT a false positive', async () => {
  const root = await Deno.makeTempDir();
  const dir = join(root, 'packages/cli/src/public/features/plugins');
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(
    join(dir, 'ok.ts'),
    [
      "if (plugin.cli?.doctorChecks?.includes('auth-backend')) return check();",
      "const cap = 'ai-tools';",
    ].join('\n'),
  );
  assertEquals(await scanCodeQuality(['packages/cli/src'], root), []);
});

Deno.test('scanner catches plugin-identity via const/array indirection (Opus IMPL-EVAL bypass)', async () => {
  const root = await Deno.makeTempDir();
  const dir = join(root, 'packages/cli/src/public/features/plugins');
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(
    join(dir, 'indirect.ts'),
    [
      "const target = 'auth';",
      'if (plugin.name === target) return;',
      "const gated = ['ai', 'workers'];",
      'if (gated.includes(plugin.name)) enable();',
      "const pred = 'streams';",
      'if (plugin.name.startsWith(pred)) return;',
    ].join('\n'),
  );
  const findings = await scanCodeQuality(['packages/cli/src'], root);
  assertEquals(findings.filter((f) => f.rule === 'plugin-name-check').length, 3);
});

Deno.test('scanner catches @ts-error suppressions and `as never` (source-side type escapes)', async () => {
  const root = await Deno.makeTempDir();
  await Deno.mkdir(`${root}/packages/cli/src`, { recursive: true });
  await Deno.writeTextFile(
    `${root}/packages/cli/src/escape.ts`,
    [
      '// @ts-expect-error upstream type mismatch',
      'const a = wrong();',
      'const b = value as never;',
      '// @ts-ignore',
      'const c = other();',
    ].join('\n'),
  );
  const rules = (await scanCodeQuality(['packages/cli/src'], root)).map((f) => f.rule);
  assertEquals(rules.filter((r) => r === 'ts-error-suppression').length, 2);
  assertEquals(rules.filter((r) => r === 'unsafe-cast').length, 1);
});

Deno.test('scanner exempts negative type fixtures from production-source findings', async () => {
  const root = await Deno.makeTempDir();
  const fixtureDir = join(root, 'packages/sdk/tests/type-fixtures');
  await Deno.mkdir(fixtureDir, { recursive: true });
  await Deno.writeTextFile(
    join(fixtureDir, 'negative-contract_type.ts'),
    '// @ts-expect-error negative compile fixture assertion\nconst value: string = 1;\n',
  );

  assertEquals(await scanCodeQuality(['packages'], root), []);
});

Deno.test('type-fixture exemption requires both its directory and suffix', async () => {
  const root = await Deno.makeTempDir();
  const sourceDir = join(root, 'packages/sdk/src');
  const testsDir = join(root, 'packages/sdk/tests');
  const fixtureDir = join(testsDir, 'type-fixtures');
  await Deno.mkdir(sourceDir, { recursive: true });
  await Deno.mkdir(fixtureDir, { recursive: true });
  const directive =
    '// @ts-expect-error negative compile fixture assertion\nconst value: string = 1;\n';
  await Deno.writeTextFile(join(sourceDir, 'ordinary-source.ts'), directive);
  await Deno.writeTextFile(join(testsDir, 'outside-directory_type.ts'), directive);
  await Deno.writeTextFile(join(fixtureDir, 'missing-suffix.ts'), directive);

  const findings = await scanCodeQuality(['packages'], root);
  assertEquals(findings.map((finding) => finding.file), [
    'packages/sdk/src/ordinary-source.ts',
    'packages/sdk/tests/outside-directory_type.ts',
    'packages/sdk/tests/type-fixtures/missing-suffix.ts',
  ]);
  assertEquals(findings.map((finding) => finding.rule), [
    'ts-error-suppression',
    'ts-error-suppression',
    'ts-error-suppression',
  ]);
});

Deno.test('scanner reports TypeScript findings inside docs/site fences at source lines', async () => {
  const root = await Deno.makeTempDir();
  const docsDir = join(root, 'docs/site/reference/example');
  await Deno.mkdir(docsDir, { recursive: true });
  await Deno.writeTextFile(
    join(docsDir, 'index.md'),
    ['# Example', '', '```ts', 'const unsafe = value as any;', '```'].join('\n'),
  );

  assertEquals(await scanCodeQuality(['docs/site'], root), [{
    rule: 'unsafe-cast',
    file: 'docs/site/reference/example/index.md',
    line: 4,
    text: 'const unsafe = value as any;',
    fenceOrdinal: 1,
  }]);
});

Deno.test('scanner respects extractor exemptions and scans docs test companions', async () => {
  const root = await Deno.makeTempDir();
  const docsDir = join(root, 'docs/site/reference/example');
  await Deno.mkdir(docsDir, { recursive: true });
  await Deno.writeTextFile(
    join(docsDir, 'index.md'),
    ['```ts no-check: intentionally incomplete fragment', 'const exempt = value as any;', '```']
      .join('\n'),
  );
  await Deno.writeTextFile(
    join(docsDir, 'examples_test.ts'),
    'const unsafe: any = value;\n',
  );

  assertEquals(await scanCodeQuality(['docs/site'], root), [{
    rule: 'explicit-any',
    file: 'docs/site/reference/example/examples_test.ts',
    line: 1,
    text: 'const unsafe: any = value;',
  }]);
});

Deno.test('scanner ignores generated docs output and caches', async () => {
  const root = await Deno.makeTempDir();
  const sourceDir = join(root, 'docs/site/reference/example');
  const outputDir = join(root, 'docs/site/_site/example');
  const cacheDir = join(root, 'docs/site/_cache/example');
  await Deno.mkdir(sourceDir, { recursive: true });
  await Deno.mkdir(outputDir, { recursive: true });
  await Deno.mkdir(cacheDir, { recursive: true });
  await Deno.writeTextFile(join(sourceDir, 'index.md'), '# Clean source\n');
  await Deno.writeTextFile(join(outputDir, 'index.md'), '```ts\nconst generated: any = value;\n');
  await Deno.writeTextFile(join(cacheDir, 'cached.md'), '```ts\nconst cached: any = value;\n');

  assertEquals(await scanCodeQuality(['docs/site'], root), []);
});

Deno.test('soundness fixtures exempt negative-type directives but no other quality rule', async () => {
  const root = await Deno.makeTempDir();
  const fixtureDir = join(root, 'packages/contracts/tests/contracts');
  await Deno.mkdir(fixtureDir, { recursive: true });
  await Deno.writeTextFile(
    join(fixtureDir, 'contract-soundness_test.ts'),
    [
      '// @ts-expect-error - intentional negative type assertion',
      'const expectedFailure: string = 1;',
      'const stillUnsafe: any = value;',
    ].join('\n'),
  );

  assertEquals(await scanCodeQuality(['packages'], root), [{
    rule: 'explicit-any',
    file: 'packages/contracts/tests/contracts/contract-soundness_test.ts',
    line: 3,
    text: 'const stillUnsafe: any = value;',
  }]);
});

Deno.test('all six repository soundness fixtures retain their explicit scanner exemption', async () => {
  const soundnessFiles: string[] = [];
  for (const root of ['packages', 'plugins']) {
    for await (const entry of Deno.readDir(root)) {
      if (!entry.isDirectory) continue;
      const pending = [join(root, entry.name)];
      while (pending.length > 0) {
        const directory = pending.pop()!;
        for await (const child of Deno.readDir(directory)) {
          const path = join(directory, child.name);
          if (child.isDirectory) pending.push(path);
          else if (child.isFile && child.name.endsWith('-soundness_test.ts')) {
            soundnessFiles.push(path);
          }
        }
      }
    }
  }

  assertEquals(soundnessFiles.length, 6);
  assertEquals(await scanCodeQuality(soundnessFiles), []);
});

Deno.test('explicit-any ignores comment-only prose but catches code before trailing comments', async () => {
  const root = await Deno.makeTempDir();
  const source = join(root, 'packages/sdk/src/comment-awareness.ts');
  await Deno.mkdir(join(root, 'packages/sdk/src'), { recursive: true });
  await Deno.writeTextFile(
    source,
    [
      '// Heuristic: any exported contract must remain typed.',
      '/* any value described in prose */',
      'const unsafe: any = value; // any trailing explanation',
    ].join('\n'),
  );

  assertEquals(await scanCodeQuality(['packages'], root), [{
    rule: 'explicit-any',
    file: 'packages/sdk/src/comment-awareness.ts',
    line: 3,
    text: 'const unsafe: any = value; // any trailing explanation',
  }]);
});

Deno.test('quality tools consume the shared docs extractor and contain no fence parser', async () => {
  const scanner = await Deno.readTextFile('.llm/tools/quality/scan-code-quality.ts');
  assertStringIncludes(scanner, "from '../docs/snippet-extractor.ts'");

  for await (const entry of Deno.readDir('.llm/tools/quality')) {
    if (!entry.isFile || !entry.name.endsWith('.ts') || entry.name.endsWith('_test.ts')) continue;
    const source = await Deno.readTextFile(join('.llm/tools/quality', entry.name));
    assertEquals(source.includes('OPENING_FENCE'), false, entry.name);
    assertEquals(source.includes('REASONED_MARKER'), false, entry.name);
    assertEquals(/`\{3,\}|~\{3,\}/.test(source), false, entry.name);
  }
});

Deno.test('scanner CLI fails when an allowance fixture exceeds --max-allow', async () => {
  const root = await Deno.makeTempDir();
  const fixture = join(root, 'allowed.ts');
  await Deno.writeTextFile(
    fixture,
    'const boundary: any = value; // quality-allow: #1276 — fixture proves budget overflow\n',
  );
  const output = await new Deno.Command(Deno.execPath(), {
    cwd: root,
    args: [
      'run',
      '--allow-read',
      join(Deno.cwd(), '.llm/tools/quality/scan-code-quality.ts'),
      '--changed-file',
      fixture,
      '--max-allow',
      '0',
    ],
  }).output();

  assertEquals(output.code, 1);
  const result = JSON.parse(new TextDecoder().decode(output.stdout));
  assertEquals(result.allowLimitExceeded, { limit: 0, count: 1 });
});

Deno.test('allowance records require one linked issue and one specific reason', async () => {
  const root = await Deno.makeTempDir();
  const source = join(root, 'packages/cli/src/allowances.ts');
  await Deno.mkdir(join(root, 'packages/cli/src'), { recursive: true });
  await Deno.writeTextFile(
    source,
    [
      'const unlinked = value as unknown as string; // quality-allow: legacy reason only',
      'const missing = value as unknown as string; // quality-allow: #1276 —',
      'const multiple = value as unknown as string; // quality-allow: #1276 — blocked by #1655',
      'const delimiter = value as unknown as string; // quality-allow: #1276 - ASCII delimiter',
    ].join('\n'),
  );

  const result = await scanCodeQualityDetailed(['packages/cli/src'], root, {
    allowanceIssueResolver: allowanceResolver(),
  });
  assertEquals(result.allowances, []);
  assertEquals(result.allowanceFailures.map((failure) => failure.kind), [
    'malformed-registration',
    'malformed-registration',
    'malformed-registration',
    'malformed-registration',
  ]);
});

Deno.test('allowance resolver accepts Backlog / Triage owners and deduplicates issue lookups', async () => {
  const root = await Deno.makeTempDir();
  const source = join(root, 'packages/cli/src/allowances.ts');
  await Deno.mkdir(join(root, 'packages/cli/src'), { recursive: true });
  await Deno.writeTextFile(
    source,
    [
      'const first = value as unknown as string; // quality-allow: #1276 — first bridge',
      'const second = value as unknown as string; // quality-allow: #1276 — second bridge',
    ].join('\n'),
  );
  const calls: number[] = [];

  const result = await scanCodeQualityDetailed(['packages/cli/src'], root, {
    allowanceIssueResolver: allowanceResolver(undefined, calls),
  });
  assertEquals(result.allowanceFailures, []);
  assertEquals(result.allowances.map((allowance) => allowance.issue), [1276, 1276]);
  assertEquals(calls, [1276]);
});

Deno.test('allowance owners fail closed when closed, unmilestoned, or unavailable', async () => {
  const root = await Deno.makeTempDir();
  const source = join(root, 'packages/cli/src/allowances.ts');
  await Deno.mkdir(join(root, 'packages/cli/src'), { recursive: true });
  await Deno.writeTextFile(
    source,
    [
      'const closed = value as unknown as string; // quality-allow: #1276 — closed owner',
      'const unmilestoned = value as unknown as string; // quality-allow: #1655 — no milestone',
      'const unavailable = value as unknown as string; // quality-allow: #9999 — offline lookup',
    ].join('\n'),
  );
  const resolver = allowanceResolver(
    new Map<number, AllowanceIssueState | Error>([
      [1276, { issue: 1276, state: 'closed', milestone: 'Backlog / Triage' }],
      [1655, { issue: 1655, state: 'open', milestone: null }],
      [9999, new Error('offline')],
    ]),
  );

  const result = await scanCodeQualityDetailed(['packages/cli/src'], root, {
    allowanceIssueResolver: resolver,
  });
  assertEquals(result.allowanceFailures.map((failure) => failure.kind), [
    'owner-closed',
    'owner-unmilestoned',
    'owner-unavailable',
  ]);
});

Deno.test('GitHub resolver fails closed offline and at the anonymous rate limit', async () => {
  const root = await Deno.makeTempDir();
  const source = join(root, 'packages/cli/src/allowance.ts');
  await Deno.mkdir(join(root, 'packages/cli/src'), { recursive: true });
  await Deno.writeTextFile(
    source,
    'const boundary = value as unknown as string; // quality-allow: #1276 — network owner\n',
  );
  const offline = createGitHubAllowanceIssueResolver({
    token: null,
    fetch: () => Promise.reject(new TypeError('network unreachable')),
  });
  const rateLimited = createGitHubAllowanceIssueResolver({
    token: null,
    fetch: () =>
      Promise.resolve(
        new Response('{"message":"API rate limit exceeded"}', {
          status: 403,
          headers: { 'content-type': 'application/json', 'x-ratelimit-remaining': '0' },
        }),
      ),
  });

  const offlineResult = await scanCodeQualityDetailed(['packages/cli/src'], root, {
    allowanceIssueResolver: offline,
  });
  const rateResult = await scanCodeQualityDetailed(['packages/cli/src'], root, {
    allowanceIssueResolver: rateLimited,
  });
  assertEquals(offlineResult.allowanceFailures[0].kind, 'owner-unavailable');
  assertStringIncludes(offlineResult.allowanceFailures[0].message, 'network unreachable');
  assertEquals(rateResult.allowanceFailures[0].kind, 'owner-unavailable');
  assertStringIncludes(rateResult.allowanceFailures[0].message, 'HTTP 403');
});

Deno.test('GitHub resolver supports tokenless forks against the fixed public owner repository', async () => {
  const root = await Deno.makeTempDir();
  const source = join(root, 'packages/cli/src/allowance.ts');
  await Deno.mkdir(join(root, 'packages/cli/src'), { recursive: true });
  await Deno.writeTextFile(
    source,
    'const boundary = value as unknown as string; // quality-allow: #1276 — fork-safe owner\n',
  );
  let requestedUrl = '';
  let authorization: string | null = 'unexpected';
  const resolver = createGitHubAllowanceIssueResolver({
    token: null,
    fetch: (input, init) => {
      requestedUrl = String(input);
      authorization = new Headers(init?.headers).get('authorization');
      return Promise.resolve(
        Response.json({
          number: 1276,
          state: 'open',
          milestone: { title: 'Backlog / Triage' },
        }),
      );
    },
  });

  const result = await scanCodeQualityDetailed(['packages/cli/src'], root, {
    allowanceIssueResolver: resolver,
  });
  assertEquals(result.allowanceFailures, []);
  assertEquals(requestedUrl, 'https://api.github.com/repos/rickylabs/netscript/issues/1276');
  assertEquals(authorization, null);
});
