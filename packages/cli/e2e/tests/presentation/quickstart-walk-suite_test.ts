import { assertEquals, assertThrows } from '@std/assert';
import { CommandGate } from '../../src/application/gates/command-gate.ts';
import { GATE, QUICKSTART } from '../../src/domain/cli-surface.ts';
import { PACKAGE_SOURCE } from '../../src/domain/extension-axes.ts';
import type {
  CommandExecutor,
  CommandRequest,
  CommandResult,
} from '../../src/ports/command-executor.ts';
import { createQuickstartWalkSuite } from '../../suites/quickstart/quickstart-walk-suite.ts';

const EXACT_CLI = 'jsr:@netscript/cli@0.0.5-canary.1';

Deno.test('quickstart walk exposes exactly seven independently named verdicts before cleanup', () => {
  const suite = createQuickstartWalkSuite({
    packageSource: PACKAGE_SOURCE.JSR,
    cliEntrypoint: EXACT_CLI,
  });
  assertEquals(suite.id, QUICKSTART.WALK);
  assertEquals(suite.gates.filter((gate) => gate.phase !== 'cleanup').map((gate) => gate.id), [
    GATE.QUICKSTART_INSTALL,
    GATE.QUICKSTART_INIT,
    GATE.QUICKSTART_SERVICE_ADD,
    GATE.QUICKSTART_ASPIRE,
    GATE.QUICKSTART_DATABASE,
    GATE.QUICKSTART_CHECK,
    GATE.QUICKSTART_SERVICE_RESPONSE,
  ]);
  assertEquals(
    suite.gates.filter((gate) => gate.phase !== 'cleanup').map((gate) => gate.title),
    [1, 2, 3, 4, 5, 6, 7].map((step) =>
      suite.gates.find((gate) => gate.title.includes(`step ${step}/7`))?.title
    ),
  );
});

Deno.test('quickstart service-add verdict initializes first, adds users, and checks that service', () => {
  const suite = createQuickstartWalkSuite({
    packageSource: PACKAGE_SOURCE.JSR,
    cliEntrypoint: EXACT_CLI,
  });
  const context = contextFor(suite.defaultOptions);
  const init = command(suite, GATE.QUICKSTART_INIT, context);
  const add = command(suite, GATE.QUICKSTART_SERVICE_ADD, context);
  assertEquals(init.includes('--service'), false);
  assertEquals(add.join(' ').includes('service'), true);
  assertEquals(add.join(' ').includes('add'), true);
  assertEquals(add.join(' ').includes('--with-client'), true);
  assertEquals(add.join(' ').includes('deno'), true);
  assertEquals(add.join(' ').includes('check'), true);
  assertEquals(add.join(' ').includes('--unstable-kv'), true);
  assertEquals(add.join(' ').includes('services/users'), true);
  assertEquals(add.join(' ').includes('task'), false);
});

Deno.test('quickstart project-check verdict runs the documented command exactly', () => {
  const suite = createQuickstartWalkSuite({
    packageSource: PACKAGE_SOURCE.JSR,
    cliEntrypoint: EXACT_CLI,
  });

  assertEquals(
    command(suite, GATE.QUICKSTART_CHECK, contextFor(suite.defaultOptions)),
    ['deno', 'task', 'check'],
  );
});

Deno.test('quickstart service-response verdict accepts service health without a database assertion', () => {
  const suite = createQuickstartWalkSuite({
    packageSource: PACKAGE_SOURCE.JSR,
    cliEntrypoint: EXACT_CLI,
  });
  const response = command(
    suite,
    GATE.QUICKSTART_SERVICE_RESPONSE,
    contextFor(suite.defaultOptions),
  );
  assertEquals(response.slice(-2), ['/repo/.llm/tmp/my-app/aspire/apphost.mts', 'users']);
});

Deno.test('quickstart commands reject a local CLI entrypoint', () => {
  const suite = createQuickstartWalkSuite({
    packageSource: PACKAGE_SOURCE.LOCAL,
    cliEntrypoint: 'packages/cli/bin/netscript.ts',
  });
  const install = suite.gates.find((gate) => gate.id === GATE.QUICKSTART_INSTALL);
  if (!install || install.kind !== 'command') throw new Error('install gate missing');
  assertThrows(
    () => install.command(contextFor(suite.defaultOptions)),
    Error,
    'requires --source jsr',
  );
});

Deno.test('quickstart restore retries canceled exit 6 and passes on a later attempt', async () => {
  const executor = new SequenceCommandExecutor([
    commandResult(6, false, 'Failed to prepare: A task was canceled.'),
    commandResult(0),
  ]);
  const result = await executeQuickstartGate(GATE.QUICKSTART_ASPIRE, executor);

  assertEquals(executor.requests.length, 2);
  assertEquals(result.verdict, 'passed');
  assertEquals(result.attempts.map((attempt) => attempt.failureClass), [
    'canceled',
    undefined,
  ]);
});

Deno.test('quickstart restore retries timeout exit 124 and passes on a later attempt', async () => {
  const executor = new SequenceCommandExecutor([
    commandResult(124),
    commandResult(0),
  ]);
  const result = await executeQuickstartGate(GATE.QUICKSTART_ASPIRE, executor);

  assertEquals(executor.requests.length, 2);
  assertEquals(result.verdict, 'passed');
  assertEquals(result.attempts.map((attempt) => attempt.failureClass), [
    'timeout',
    undefined,
  ]);
});

Deno.test('quickstart restore exhausts exactly maxRetries plus one attempts', async () => {
  const executor = new SequenceCommandExecutor([
    commandResult(124),
    commandResult(124),
    commandResult(124),
  ]);
  const result = await executeQuickstartGate(GATE.QUICKSTART_ASPIRE, executor);

  assertEquals(executor.requests.length, 3);
  assertEquals(result.verdict, 'failed');
  assertEquals(result.attempts.length, 3);
  assertEquals(result.attempts.map((attempt) => attempt.attempt), [1, 2, 3]);
});

Deno.test('quickstart PGDATA teardown skips with a message when setup state is absent', async () => {
  const executor = new SequenceCommandExecutor([commandResult(78)]);
  const result = await executeQuickstartGate(GATE.QUICKSTART_DATABASE_INTEGRITY, executor);

  assertEquals(result.verdict, 'skipped');
  assertEquals(
    Reflect.get(result, 'message'),
    'PGDATA integrity skipped: setup state was never created.',
  );
  assertEquals(result.error, undefined);
});

function command(
  suite: ReturnType<typeof createQuickstartWalkSuite>,
  id: string,
  context: ReturnType<typeof contextFor>,
): readonly string[] {
  const gate = suite.gates.find((candidate) => candidate.id === id);
  if (!gate || gate.kind !== 'command') throw new Error(`${id} command gate missing`);
  return gate.command(context);
}

function contextFor(options: ReturnType<typeof createQuickstartWalkSuite>['defaultOptions']) {
  return {
    request: { suiteId: QUICKSTART.WALK, options },
    project: {
      repoRoot: '/repo',
      cliEntrypoint: options.cliEntrypoint,
      smokeRoot: '/repo/.llm/tmp',
      projectName: 'my-app',
      projectRoot: '/repo/.llm/tmp/my-app',
      appHost: '/repo/.llm/tmp/my-app/aspire/apphost.mts',
    },
  } as const;
}

function executeQuickstartGate(id: string, executor: CommandExecutor) {
  const suite = createQuickstartWalkSuite({
    packageSource: PACKAGE_SOURCE.JSR,
    cliEntrypoint: EXACT_CLI,
  });
  const gate = suite.gates.find((candidate) => candidate.id === id);
  if (!gate || gate.kind !== 'command') throw new Error(`${id} command gate missing`);
  return new CommandGate(gate, executor).execute(
    contextFor(suite.defaultOptions),
  );
}

function commandResult(code: number, timedOut = false, stderr = ''): CommandResult {
  return {
    command: ['deno', 'run', 'aspire-walk.ts'],
    cwd: '/repo/.llm/tmp/my-app',
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
    const result = this.results[this.requests.length - 1];
    if (!result) throw new Error('No fake command response configured.');
    return Promise.resolve(result);
  }
}
