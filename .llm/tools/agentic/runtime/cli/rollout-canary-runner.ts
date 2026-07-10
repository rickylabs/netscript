/** Thin orchestration over shipped agentic CLIs for the #582 rollout matrix. */

import {
  aggregateRolloutOutcome,
  type CanaryResult,
  type FailureClassification,
  type RolloutOutcome,
} from '../rollout-canary.ts';
import { OPENROUTER_MODEL_IDS } from '../../config/models.ts';

export interface CommandRequest {
  readonly display: string;
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd: string;
}
export interface CommandResult {
  readonly exitCode: number;
  readonly stdout: string;
}
export interface RolloutCommandRunner {
  run(request: CommandRequest): Promise<CommandResult>;
}

const OWNER_RISK =
  'Interactive behavior is owner-accepted; automation does not reproduce mobile UI.';
const PROVIDER_COMMANDS = [
  ['claude-anthropic-native', 'claude-opus-4-8', 'high'],
  ['codex-openai-native', 'gpt-5.6', 'medium'],
  ['claude-openrouter', OPENROUTER_MODEL_IDS.minimax, 'high'],
  ['codex-openrouter', OPENROUTER_MODEL_IDS.glm, 'xhigh'],
] as const;

class LocalCommandRunner implements RolloutCommandRunner {
  async run(request: CommandRequest): Promise<CommandResult> {
    const output = await new Deno.Command(request.executable, {
      args: [...request.args],
      cwd: request.cwd,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    return {
      exitCode: output.code,
      stdout: new TextDecoder().decode(output.stdout.slice(0, 128 * 1024)),
    };
  }
}

function json(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}
function statusOf(value: unknown): string | null {
  const record = object(value);
  return typeof record?.status === 'string' ? record.status : null;
}
function result(
  values: Omit<CanaryResult, 'evidence'> & {
    readonly summary: string;
    readonly exitCodes?: number[];
    readonly references?: string[];
  },
): CanaryResult {
  const { summary, exitCodes, references, ...row } = values;
  return { ...row, evidence: { summary, exitCodes, references } };
}
function command(
  executable: string,
  args: readonly string[],
  cwd: string,
  display: string,
): CommandRequest {
  return { executable, args, cwd, display };
}

async function nativeHealth(runner: RolloutCommandRunner, cwd: string): Promise<CanaryResult> {
  const probes = await Promise.all([
    runner.run(command('deno', ['--version'], cwd, 'deno --version')),
    runner.run(command('git', ['--version'], cwd, 'git --version')),
    runner.run(command('node', ['--version'], cwd, 'node --version')),
  ]);
  const doctor = await runner.run(command(
    'deno',
    ['task', 'agentic:runtime', 'doctor', '--json'],
    cwd,
    'deno task agentic:runtime doctor --json',
  ));
  const doctorStatus = statusOf(json(doctor.stdout));
  const commandFailed = probes.some((entry) => entry.exitCode !== 0) || !doctorStatus;
  const degraded = !commandFailed && doctor.exitCode !== 0;
  return result({
    id: 'native_wsl_health',
    command:
      'deno --version; git --version; node --version; deno task agentic:runtime doctor --json',
    expected:
      'Native WSL toolchain responds and runtime doctor returns structured health evidence.',
    actual: commandFailed
      ? 'At least one version probe or the structured doctor contract failed.'
      : `Version probes succeeded; runtime doctor reported ${doctorStatus}.`,
    evidenceMode: 'live',
    classification: commandFailed ? 'command_failed' : degraded ? 'runtime_degraded' : 'none',
    status: commandFailed ? 'fail' : degraded ? 'conditional_pass' : 'pass',
    summary: `Live version exits ${
      probes.map((entry) => entry.exitCode).join('/')
    }; doctor exit ${doctor.exitCode}.`,
    exitCodes: [...probes.map((entry) => entry.exitCode), doctor.exitCode],
    residualRisks: degraded
      ? ['Runtime doctor remains degraded; inspect its structured component diagnostics locally.']
      : [],
  });
}

async function codexLifecycle(runner: RolloutCommandRunner, cwd: string): Promise<CanaryResult> {
  const status = await runner.run(command(
    'deno',
    ['task', 'agentic:runtime', 'status', '--agent', 'codex', '--worktree', cwd, '--json'],
    cwd,
    'deno task agentic:runtime status --agent codex --worktree $WORKTREE --json',
  ));
  const repair = await runner.run(command(
    'deno',
    ['task', 'agentic:runtime', 'repair', 'codex-remote', '--worktree', cwd, '--dry-run', '--json'],
    cwd,
    'deno task agentic:runtime repair codex-remote --worktree $WORKTREE --dry-run --json',
  ));
  const statusStructured = json(status.stdout) !== null;
  const repairStructured = json(repair.stdout) !== null;
  const failed = !statusStructured || !repairStructured || [5, 3, 2].includes(repair.exitCode);
  return result({
    id: 'codex_remote_lifecycle',
    command:
      'deno task agentic:runtime status --agent codex --worktree $WORKTREE --json; deno task agentic:runtime repair codex-remote --worktree $WORKTREE --dry-run --json',
    expected:
      'Status and repair inspection are structured; no daemon restart occurs; owner confirms mobile visibility.',
    actual: failed
      ? 'A bounded status or repair inspection did not produce usable structured evidence.'
      : 'Status and repair dry-run completed without restarting the active daemon; mobile visibility is owner-accepted working.',
    evidenceMode: 'owner_accepted',
    classification: failed ? 'command_failed' : 'owner_accepted_working',
    status: failed ? 'fail' : 'conditional_pass',
    summary:
      `Live status exit ${status.exitCode}; repair dry-run exit ${repair.exitCode}; no live repair requested.`,
    exitCodes: [status.exitCode, repair.exitCode],
    residualRisks: failed ? [] : [
      OWNER_RISK,
      'Daemon restart and rescue were not forced during an active implementation thread.',
    ],
  });
}

async function antigravity(runner: RolloutCommandRunner, cwd: string): Promise<CanaryResult> {
  const live = await runner.run(command(
    'deno',
    [
      'task',
      'agentic:antigravity-evidence',
      '--probe',
      'web-citations',
      '--cwd',
      cwd,
      '--timeout-ms',
      '30000',
      '--json',
    ],
    cwd,
    'deno task agentic:antigravity-evidence --probe web-citations --cwd $WORKTREE --timeout-ms 30000 --json',
  ));
  const observed = object(json(live.stdout));
  const liveStatus = typeof observed?.status === 'string' ? observed.status : null;
  const authBlocked = live.exitCode === 4 || liveStatus === 'blocked';
  const failed = !liveStatus || (!authBlocked && live.exitCode !== 0);
  return result({
    id: 'antigravity_grounded_search',
    command:
      'deno task agentic:antigravity-evidence --probe web-citations --cwd $WORKTREE --timeout-ms 30000 --json',
    expected:
      'Bounded grounded-search evidence is classified without raw output; owner acceptance remains distinct from live auth state.',
    actual: failed
      ? 'The bounded evidence lane failed without a recognized structured status.'
      : authBlocked
      ? 'Live evidence remained auth-blocked; grounded search and citation persistence are owner-accepted working.'
      : 'Live bounded evidence succeeded; grounded search and citation persistence are also owner-accepted working.',
    evidenceMode: 'owner_accepted',
    classification: failed
      ? 'command_failed'
      : authBlocked
      ? 'auth_blocked'
      : 'owner_accepted_working',
    status: failed ? 'fail' : 'conditional_pass',
    summary: `Live bounded Antigravity evidence exit ${live.exitCode}; structured status ${
      liveStatus ?? 'missing'
    }.`,
    exitCodes: [live.exitCode],
    references: ['PR #587'],
    residualRisks: failed ? [] : [
      OWNER_RISK,
      ...(authBlocked ? ['Automated Antigravity evidence remains authentication-blocked.'] : []),
    ],
  });
}

async function providers(runner: RolloutCommandRunner, cwd: string): Promise<CanaryResult> {
  const observations = await Promise.all(
    PROVIDER_COMMANDS.map(([profile, model, effort]) =>
      runner.run(command(
        'deno',
        [
          'task',
          'agentic:provider-canary',
          '--profile',
          profile,
          '--model',
          model,
          '--effort',
          effort,
          '--worktree',
          cwd,
        ],
        cwd,
        `deno task agentic:provider-canary --profile ${profile} --model ${model} --effort ${effort} --worktree $WORKTREE`,
      ))
    ),
  );
  const parsed = observations.map((entry) => object(json(entry.stdout)));
  const malformed = parsed.some((entry) => !entry);
  const statuses = parsed.map((entry) =>
    typeof entry?.status === 'string' ? entry.status : 'missing'
  );
  const failed = malformed || statuses.includes('failed');
  const blocked = !failed && statuses.includes('blocked');
  const classification: FailureClassification = failed
    ? 'capability_incompatible'
    : blocked
    ? 'credential_absent'
    : 'none';
  return result({
    id: 'provider_compatibility',
    command:
      'deno task agentic:provider-canary for Claude/Codex native and OpenRouter profiles (see evidence references)',
    expected:
      'Four read-only canaries return structured compatibility evidence; absent credentials block without fabricated success.',
    actual: failed
      ? 'At least one provider canary returned malformed or incompatible evidence.'
      : blocked
      ? 'Provider canaries returned structured credential-absent diagnostics; no compatibility pass was fabricated.'
      : 'All provider canaries returned complete supported capability evidence.',
    evidenceMode: 'live',
    classification,
    status: failed ? 'fail' : blocked ? 'conditional_pass' : 'pass',
    summary: `Live provider statuses: ${statuses.join(', ')}; exits ${
      observations.map((entry) => entry.exitCode).join('/')
    }.`,
    exitCodes: observations.map((entry) => entry.exitCode),
    references: PROVIDER_COMMANDS.map(([profile, model, effort]) =>
      `${profile}:${model}:${effort}`
    ),
    residualRisks: blocked
      ? ['Credentialed provider compatibility remains unobserved on this machine.']
      : [],
  });
}

async function quotaFallback(runner: RolloutCommandRunner, cwd: string): Promise<CanaryResult> {
  const tests = await runner.run(command(
    'deno',
    [
      'test',
      '--no-lock',
      '--allow-read',
      '--allow-write',
      '.llm/tools/agentic/runtime/routing-state-machine_test.ts',
    ],
    cwd,
    'deno test --no-lock --allow-read --allow-write .llm/tools/agentic/runtime/routing-state-machine_test.ts',
  ));
  const state = await runner.run(command(
    'deno',
    ['task', 'agentic:routing-state', '--json'],
    cwd,
    'deno task agentic:routing-state --json',
  ));
  const stateJson = json(state.stdout);
  const failed = tests.exitCode !== 0 || state.exitCode !== 0 || !Array.isArray(stateJson);
  return result({
    id: 'quota_fallback_restoration',
    command:
      'deno test --no-lock --allow-read --allow-write .llm/tools/agentic/runtime/routing-state-machine_test.ts; deno task agentic:routing-state --json',
    expected:
      'Synthetic transition suite proves exhaust/fallback/persist/reset/restore and live persisted state parses read-only.',
    actual: failed
      ? 'State-machine tests or read-only persisted-state inspection failed.'
      : `Synthetic transition suite passed; live routing-state inspection parsed ${stateJson.length} persisted entries.`,
    evidenceMode: 'synthetic',
    classification: failed ? 'command_failed' : 'none',
    status: failed ? 'fail' : 'pass',
    summary: `State-machine test exit ${tests.exitCode}; routing-state exit ${state.exitCode}.`,
    exitCodes: [tests.exitCode, state.exitCode],
    residualRisks: [],
  });
}

/** Runs bounded canaries and merges explicit owner/provenance evidence into one validated matrix. */
export async function runRolloutCanaries(
  cwd: string,
  generatedAt: string,
  runner: RolloutCommandRunner = new LocalCommandRunner(),
): Promise<RolloutOutcome> {
  const live = await Promise.all([
    nativeHealth(runner, cwd),
    codexLifecycle(runner, cwd),
    antigravity(runner, cwd),
    providers(runner, cwd),
    quotaFallback(runner, cwd),
  ]);
  const rows: CanaryResult[] = [
    ...live,
    result({
      id: 'claude_mobile_reconnect',
      command:
        'Owner procedure: interrupt sleep/network, reopen Claude Remote Control, and resume the same session.',
      expected: 'The same Claude session reconnects after sleep or network interruption.',
      actual:
        'Owner accepted reconnect behavior as working; no raw mobile session evidence is fabricated.',
      evidenceMode: 'owner_accepted',
      classification: 'owner_accepted_working',
      status: 'conditional_pass',
      summary: 'Owner directive records accepted working behavior.',
      residualRisks: [OWNER_RISK],
    }),
    result({
      id: 'claude_isolated_sessions',
      command:
        'Owner procedure: launch Claude sessions in two isolated worktrees and verify independent resume.',
      expected: 'Multiple Claude sessions remain isolated by worktree and resume independently.',
      actual:
        'Owner accepted isolated-session behavior as working; automation does not invent UI evidence.',
      evidenceMode: 'owner_accepted',
      classification: 'owner_accepted_working',
      status: 'conditional_pass',
      summary: 'Owner directive records accepted working behavior.',
      residualRisks: [OWNER_RISK],
    }),
    result({
      id: 'opposite_family_epic_run',
      command:
        'Review merged PRs #585, #586, #587, #588, #589, and #590 plus coordinator Tier-A records.',
      expected:
        'Epic planning and implementation use Codex with opposite-family Claude coordinator evaluation.',
      actual:
        'Merged PR provenance records the six preceding epic layers and opposite-family coordinator review.',
      evidenceMode: 'provenance',
      classification: 'none',
      status: 'pass',
      summary: 'Integration baseline b438f16d contains merged PRs #585-#590.',
      references: ['PR #585', 'PR #586', 'PR #587', 'PR #588', 'PR #589', 'PR #590'],
      residualRisks: [],
    }),
    result({
      id: 'windows_native_rollback',
      command:
        'Follow PR #584 Windows break-glass: select native Windows Claude and restore native-provider defaults.',
      expected:
        'Documented rollback returns operation to native Windows Claude and native-provider defaults.',
      actual:
        'PR #584 is the proven Windows break-glass provenance; rollout code does not execute rollback.',
      evidenceMode: 'provenance',
      classification: 'none',
      status: 'pass',
      summary: 'Rollback procedure is documented and provenance-cited.',
      references: ['PR #584'],
      residualRisks: [],
    }),
  ];
  return aggregateRolloutOutcome(rows, generatedAt, 'b438f16d');
}
