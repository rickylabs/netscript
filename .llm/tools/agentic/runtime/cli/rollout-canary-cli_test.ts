import { parseRolloutArgs } from './rollout-canary-cli.ts';
import { assert } from '@std/assert';

Deno.test('rollout CLI accepts only worktree and output paths', () => {
  const parsed = parseRolloutArgs([
    '--worktree',
    '/home/codex/repos/worktree',
    '--output',
    '.llm/tmp/rollout.json',
    '--report',
    'ROLLOUT.md',
  ]);
  assert(parsed.worktree === '/home/codex/repos/worktree');
  assert(parsed.output === '.llm/tmp/rollout.json');
  assert(parsed.report === 'ROLLOUT.md');
  for (
    const args of [
      ['--worktree', '/home/codex/repos/worktree'],
      ['--worktree', 'relative', '--output', 'out.json'],
      ['--promote', 'main', '--worktree', '/home/codex/repos/worktree', '--output', 'out.json'],
    ]
  ) {
    let rejected = false;
    try {
      parseRolloutArgs(args);
    } catch {
      rejected = true;
    }
    assert(rejected);
  }
});
