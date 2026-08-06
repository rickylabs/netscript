import { assert, assertEquals } from '@std/assert';
import { parseProviderCanaryArgs } from './provider-canary.ts';
import { OPENROUTER_MODEL_IDS } from '../../config/models.ts';

const worktree = '/home/codex/repos/provider-canary-test';

Deno.test('provider canary defaults to exhaustive credential-free static mode', () => {
  assertEquals(parseProviderCanaryArgs([], worktree), { mode: 'static', worktree });
  assertEquals(parseProviderCanaryArgs(['--all', '--worktree', worktree]), {
    mode: 'static',
    worktree,
  });
});

Deno.test('provider calls require explicit live mode with complete route identity', () => {
  const live = parseProviderCanaryArgs([
    '--live',
    '--profile',
    'claude-openrouter',
    '--preset',
    'claude-evaluator-minimax-m3',
    '--model',
    OPENROUTER_MODEL_IDS.minimax,
    '--effort',
    'high',
    '--worktree',
    worktree,
  ]);
  assertEquals(live.mode, 'live');
  if (live.mode === 'live') {
    assertEquals(live.route.provider, 'openrouter');
    assertEquals(live.route.presetId, 'claude-evaluator-minimax-m3');
  }
  for (
    const args of [
      ['--profile', 'claude-openrouter', '--model', 'caller-model', '--effort', 'xhigh'],
      ['--live', '--all', '--worktree', worktree],
      ['--live', '--profile', 'claude-openrouter', '--worktree', worktree],
      [
        '--live',
        '--profile',
        'claude-openrouter',
        '--preset',
        'stale-preset',
        '--model',
        'caller-model',
        '--effort',
        'high',
        '--worktree',
        worktree,
      ],
    ]
  ) {
    let rejected = false;
    try {
      parseProviderCanaryArgs(args, worktree);
    } catch {
      rejected = true;
    }
    assert(rejected);
  }
});
