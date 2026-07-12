import {
  type CommandRequest,
  type CommandResult,
  type RolloutCommandRunner,
  runRolloutCanaries,
} from './rollout-canary-runner.ts';
import { assertEquals as equals } from '@std/assert';

class FakeRunner implements RolloutCommandRunner {
  readonly requests: CommandRequest[] = [];
  constructor(readonly providerStatus: 'passed' | 'blocked' | 'failed' = 'blocked') {}
  run(request: CommandRequest): Promise<CommandResult> {
    this.requests.push(request);
    if (request.display.includes('doctor')) {
      return Promise.resolve({ exitCode: 0, stdout: JSON.stringify({ status: 'healthy' }) });
    }
    if (request.display.includes('runtime status')) {
      return Promise.resolve({ exitCode: 0, stdout: JSON.stringify({ status: 'passed' }) });
    }
    if (request.display.includes('repair codex-remote')) {
      return Promise.resolve({
        exitCode: 0,
        stdout: JSON.stringify({ status: 'passed', state: 'managed' }),
      });
    }
    if (request.display.includes('antigravity-evidence')) {
      return Promise.resolve({ exitCode: 4, stdout: JSON.stringify({ status: 'blocked' }) });
    }
    if (request.display.includes('provider-canary')) {
      return Promise.resolve({
        exitCode: this.providerStatus === 'passed' ? 0 : this.providerStatus === 'blocked' ? 4 : 5,
        stdout: JSON.stringify({ status: this.providerStatus }),
      });
    }
    if (request.display.includes('routing-state --json')) {
      return Promise.resolve({ exitCode: 0, stdout: '[]' });
    }
    return Promise.resolve({ exitCode: 0, stdout: 'bounded' });
  }
}

Deno.test('runner orchestrates shipped commands and returns nine secret-safe rows', async () => {
  const runner = new FakeRunner();
  const outcome = await runRolloutCanaries(
    '/home/codex/repos/worktree',
    '2026-07-10T00:00:00.000Z',
    runner,
  );
  equals(outcome.canaries.length, 9);
  equals(outcome.overallStatus, 'conditional_pass');
  equals(outcome.promotionRecommendation, 'promote_with_conditions');
  equals(
    outcome.canaries.find((row) => row.id === 'provider_compatibility')?.classification,
    'credential_absent',
  );
  equals(
    outcome.canaries.find((row) => row.id === 'antigravity_grounded_search')?.classification,
    'auth_blocked',
  );
  equals(
    outcome.canaries.find((row) => row.id === 'claude_mobile_reconnect')?.classification,
    'owner_accepted_working',
  );
  equals(
    runner.requests.filter((request) => request.display.includes('provider-canary')).length,
    4,
  );
  equals(
    runner.requests.filter((request) => request.display.includes('provider-canary')).every(
      (request) => request.args.includes('--live'),
    ),
    true,
  );
  equals(runner.requests.some((request) => request.display.includes('--dry-run')), true);
  equals(
    runner.requests.some((request) =>
      request.display.includes(' repair ') && !request.display.includes('--dry-run')
    ),
    false,
  );
});

Deno.test('provider incompatibility blocks the recommendation', async () => {
  const outcome = await runRolloutCanaries(
    '/home/codex/repos/worktree',
    '2026-07-10T00:00:00.000Z',
    new FakeRunner('failed'),
  );
  equals(outcome.canaries.find((row) => row.id === 'provider_compatibility')?.status, 'fail');
  equals(outcome.promotionRecommendation, 'do_not_promote');
});
