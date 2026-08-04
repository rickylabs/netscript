import { assertEquals } from '@std/assert';
import { CommandGate } from '../../../src/application/gates/command-gate.ts';
import { GATE, GATE_PHASE } from '../../../src/domain/cli-surface.ts';
import type {
  CommandGateDefinition,
  GateFailureClass,
} from '../../../src/domain/gate-definition.ts';
import type { RunContext, RunOptions } from '../../../src/domain/run-context.ts';
import type { SmokeProject } from '../../../src/domain/smoke-project.ts';
import type {
  CommandExecutor,
  CommandRequest,
  CommandResult,
} from '../../../src/ports/command-executor.ts';

const RETRY = { classes: ['timeout', 'canceled'] as const, maxRetries: 1 as const };

Deno.test('command gate never retries an assertion failure', async () => {
  const executor = new SequenceCommandExecutor([failure(1)]);
  const result = await execute(executor, { classes: ['assertion'], maxRetries: 1 });

  assertEquals(executor.requests.length, 1);
  assertEquals(result.verdict, 'failed');
  assertEquals(result.retried, false);
  assertEquals(result.attempts, [{
    attempt: 1,
    verdict: 'failed',
    durationMs: result.attempts[0].durationMs,
    failureClass: 'assertion',
    exitCode: 1,
  }]);
});

Deno.test('command gate retries a timeout and records a passing second attempt', async () => {
  const executor = new SequenceCommandExecutor([failure(1, true), success()]);
  const result = await execute(executor, RETRY);

  assertEquals(executor.requests.length, 2);
  assertEquals(result.verdict, 'passed');
  assertEquals(result.retried, true);
  assertEquals(
    result.attempts.map(({ attempt, verdict, failureClass }) => ({
      attempt,
      verdict,
      failureClass,
    })),
    [
      { attempt: 1, verdict: 'failed', failureClass: 'timeout' },
      { attempt: 2, verdict: 'passed', failureClass: undefined },
    ],
  );
});

Deno.test('command gate classifies the Deno cancellation marker and retries it', async () => {
  const executor = new SequenceCommandExecutor([
    failure(6, false, 'Task was CANCELED by the runner'),
    success(),
  ]);
  const result = await execute(executor, RETRY);

  assertEquals(executor.requests.length, 2);
  assertEquals(result.attempts[0].failureClass, 'canceled');
  assertEquals(result.verdict, 'passed');
});

Deno.test('command gate treats exit 6 without the cancellation marker as an assertion', async () => {
  const executor = new SequenceCommandExecutor([failure(6)]);
  const result = await execute(executor, RETRY);

  assertEquals(executor.requests.length, 1);
  assertEquals(result.attempts[0].failureClass, 'assertion');
  assertEquals(result.retried, false);
});

Deno.test('command gate preserves both timeout durations after retries are exhausted', async () => {
  const executor = new SequenceCommandExecutor([failure(1, true), failure(1, true)]);
  const result = await execute(executor, RETRY);

  assertEquals(result.verdict, 'failed');
  assertEquals(result.retried, true);
  assertEquals(result.attempts.length, 2);
  assertEquals(result.attempts.every((attempt) => attempt.durationMs >= 0), true);
  assertEquals(result.attempts.map((attempt) => attempt.failureClass), ['timeout', 'timeout']);
});

Deno.test('command gate without retry configuration executes once', async () => {
  const executor = new SequenceCommandExecutor([failure(1, true)]);
  const result = await execute(executor);

  assertEquals(executor.requests.length, 1);
  assertEquals(result.attempts.length, 1);
  assertEquals(result.retried, false);
});

function execute(
  executor: CommandExecutor,
  retry?: { readonly classes: readonly GateFailureClass[]; readonly maxRetries: 1 },
) {
  const definition: CommandGateDefinition = {
    kind: 'command',
    id: GATE.RUNTIME_ASPIRE_RESTORE,
    title: 'Restore Aspire TypeScript SDK',
    phase: GATE_PHASE.RUNTIME,
    critical: true,
    cwd: () => '/workspace',
    command: () => ['aspire', 'restore'],
    retry,
  };
  return new CommandGate(definition, executor).execute(createContext());
}

function createContext(): RunContext {
  return {
    request: {
      suiteId: 'scaffold.runtime',
      options: {
        repoRoot: '.',
        cliEntrypoint: './packages/cli/bin/netscript.ts',
        smokeRoot: '.llm/tmp/cli-e2e',
        projectName: 'command-gate-test',
        database: 'postgres',
        packageSource: 'local',
        plugins: [],
        samples: true,
        cache: true,
        cleanup: true,
        format: 'json',
        commandTimeoutMs: 30_000,
        httpTimeoutMs: 30_000,
      } satisfies RunOptions,
    },
    project: {
      repoRoot: '.',
      cliEntrypoint: './packages/cli/bin/netscript.ts',
      smokeRoot: '.llm/tmp/cli-e2e',
      projectName: 'command-gate-test',
      projectRoot: '/workspace',
      appHost: '/workspace/aspire/apphost.mts',
    } satisfies SmokeProject,
  };
}

function success(): CommandResult {
  return result(0, false, '');
}

function failure(code: number, timedOut = false, stderr = ''): CommandResult {
  return result(code, timedOut, stderr);
}

function result(code: number, timedOut: boolean, stderr: string): CommandResult {
  return {
    command: ['aspire', 'restore'],
    cwd: '/workspace',
    code,
    stdout: '',
    stderr,
    timedOut,
  };
}

class SequenceCommandExecutor implements CommandExecutor {
  readonly requests: CommandRequest[] = [];

  constructor(private readonly results: readonly CommandResult[]) {}

  run(request: CommandRequest): Promise<CommandResult> {
    this.requests.push(request);
    const response = this.results[this.requests.length - 1];
    if (!response) throw new Error('No fake command response configured.');
    return Promise.resolve(response);
  }
}
