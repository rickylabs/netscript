import { parseRolloutArgs } from './rollout-canary-cli.ts';

function assert(condition: unknown): asserts condition {
  if (!condition) throw new Error('assertion failed');
}

Deno.test('rollout CLI accepts only worktree and output paths', () => {
  const parsed = parseRolloutArgs([
    '--worktree',
    '/home/codex/repos/worktree',
    '--output',
    '.llm/tmp/rollout.json',
  ]);
  assert(parsed.worktree === '/home/codex/repos/worktree');
  assert(parsed.output === '.llm/tmp/rollout.json');
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
