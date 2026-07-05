import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import {
  decide,
  isDocsOnlyPath,
  isImpacting,
  parseFiles,
  parseLabels,
} from './ci-classify-changes.ts';

Deno.test('docs surfaces are docs-only', () => {
  for (
    const p of [
      'README.md',
      'docs/site/index.md',
      'docs/architecture/doctrine/x.md',
      '.llm/harness/workflow/run-loop.md',
      '.agents/skills/netscript-pr/SKILL.md',
      '.claude/skills/x/SKILL.md',
      'CONTRIBUTING.mdx',
      '.github/pull_request_template.md',
    ]
  ) {
    assertEquals(isDocsOnlyPath(p), true, `expected docs-only: ${p}`);
  }
});

Deno.test('denylist wins over the markdown allowlist', () => {
  // Markdown under an impacting prefix must NOT be docs-only.
  assertEquals(isDocsOnlyPath('packages/cli/README.md'), false);
  assertEquals(isDocsOnlyPath('plugins/workers/CHANGELOG.md'), false);
  assertEquals(isDocsOnlyPath('apps/demo/README.md'), false);
});

Deno.test('impacting surfaces force the gate', () => {
  for (
    const p of [
      'packages/cli/e2e/cli.ts',
      'packages/service/mod.ts',
      'plugins/sagas/mod.ts',
      'apps/demo/main.ts',
      'deno.json',
      'deno.jsonc',
      'deno.lock',
      'examples/x/deno.json',
      '.github/workflows/e2e-cli.yml',
    ]
  ) {
    assertEquals(isImpacting(p), true, `expected impacting: ${p}`);
    assertEquals(isDocsOnlyPath(p), false, `expected not docs-only: ${p}`);
  }
});

Deno.test('unknown root paths force the gate (conservative default)', () => {
  assertEquals(isDocsOnlyPath('tsconfig.json'), false);
  assertEquals(isDocsOnlyPath('mod.ts'), false);
  assertEquals(isDocsOnlyPath('.gitignore'), false);
});

Deno.test('decide: docs-only PR skips both jobs', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['docs/site/a.md', 'README.md', '.llm/x.md'],
    labels: [],
  });
  assertEquals(d.docsOnly, true);
  assertEquals(d.runStatic, false);
  assertEquals(d.runRuntime, false);
});

Deno.test('decide: one code file forces both jobs', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['docs/site/a.md', 'packages/cli/mod.ts'],
    labels: [],
  });
  assertEquals(d.docsOnly, false);
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
});

Deno.test('decide: empty diff is not docs-only -> runs', () => {
  const d = decide({ eventName: 'pull_request', files: [], labels: [] });
  assertEquals(d.docsOnly, false);
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
});

Deno.test('decide: ci:skip-e2e skips runtime only', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/mod.ts'],
    labels: ['ci:skip-e2e'],
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, false);
});

Deno.test('decide: ci:skip-scaffold skips static only', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/mod.ts'],
    labels: ['ci:skip-scaffold'],
  });
  assertEquals(d.runStatic, false);
  assertEquals(d.runRuntime, true);
});

Deno.test('decide: both skip labels skip both jobs', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/mod.ts'],
    labels: ['ci:skip-scaffold', 'ci:skip-e2e'],
  });
  assertEquals(d.runStatic, false);
  assertEquals(d.runRuntime, false);
});

Deno.test('decide: ci:full overrides docs-only', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['docs/site/a.md'],
    labels: ['ci:full'],
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
});

Deno.test('decide: ci:full overrides skip labels', () => {
  const d = decide({
    eventName: 'pull_request',
    files: ['packages/cli/mod.ts'],
    labels: ['ci:full', 'ci:skip-e2e', 'ci:skip-scaffold'],
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
});

Deno.test('decide: workflow_dispatch runs both (no diff)', () => {
  const d = decide({ eventName: 'workflow_dispatch', files: [], labels: [] });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, true);
});

Deno.test('decide: workflow_dispatch honours skip labels', () => {
  const d = decide({
    eventName: 'workflow_dispatch',
    files: [],
    labels: ['ci:skip-e2e'],
  });
  assertEquals(d.runStatic, true);
  assertEquals(d.runRuntime, false);
});

Deno.test('parseLabels: JSON array and comma forms', () => {
  assertEquals(parseLabels('["a","b"]'), ['a', 'b']);
  assertEquals(parseLabels('a, b ,c'), ['a', 'b', 'c']);
  assertEquals(parseLabels(''), []);
  assertEquals(parseLabels(undefined), []);
});

Deno.test('parseFiles: newline and comma forms', () => {
  assertEquals(parseFiles('a.md\nb.ts'), ['a.md', 'b.ts']);
  assertEquals(parseFiles('a.md,b.ts\n'), ['a.md', 'b.ts']);
  assertEquals(parseFiles(''), []);
});
