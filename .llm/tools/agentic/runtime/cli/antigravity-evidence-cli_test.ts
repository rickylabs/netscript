import { parseAntigravityEvidenceArgs } from './antigravity-evidence-cli.ts';
import { assertEquals } from '@std/assert';

Deno.test('evidence CLI accepts only bounded identifiers and fixed probe kinds', () => {
  assertEquals(
    parseAntigravityEvidenceArgs([
      '--probe',
      'web-citations',
      '--cwd',
      '/home/codex/repos/worktree',
      '--timeout-ms',
      '30000',
      '--model',
      'caller-model',
      '--aggregate',
      '/home/codex/repos/worktree/.llm/tmp/docs/antigravity-citations.json',
      '--json',
    ]),
    {
      probe: 'web-citations',
      cwd: '/home/codex/repos/worktree',
      timeoutMs: 30000,
      model: 'caller-model',
      agent: undefined,
      project: undefined,
      aggregate: '/home/codex/repos/worktree/.llm/tmp/docs/antigravity-citations.json',
      json: true,
    },
  );
});

Deno.test('evidence CLI rejects prompt, credential, relative aggregation, and excessive timeout flags', () => {
  const invalid = [
    ['--probe', 'headless', '--cwd', '/worktree', '--prompt', 'secret'],
    ['--probe', 'headless', '--cwd', '/worktree', '--credential', 'secret'],
    ['--probe', 'headless', '--cwd', '/worktree', '--aggregate', 'relative.json'],
    ['--probe', 'headless', '--cwd', '/worktree', '--timeout-ms', '60001'],
  ];
  for (const args of invalid) {
    let rejected = false;
    try {
      parseAntigravityEvidenceArgs(args);
    } catch {
      rejected = true;
    }
    assertEquals(rejected, true);
  }
});
