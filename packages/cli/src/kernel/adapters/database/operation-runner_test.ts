/**
 * @module infra/database/operation-runner_test
 */

import { join } from '@std/path';
import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import { DbOperationRunner } from './operation-runner.ts';
import type {
  AppHostLifecycleLease,
  AppHostLifecycleLock,
} from './apphost-lifecycle-lock.ts';
import type { DbOperationRequest, DiscoveredDatabase } from '../../domain/db-engine.ts';

interface CommandOutput {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

interface RecordedCall {
  readonly args: readonly string[];
  readonly options: {
    readonly cwd: string;
    readonly env?: Record<string, string>;
    readonly signal?: AbortSignal;
  };
}

type OutputStep = CommandOutput | ((options: RecordedCall['options']) => Promise<CommandOutput>);

class FakeAspireExecutor {
  readonly outputCalls: RecordedCall[] = [];
  readonly spawnCalls: RecordedCall[] = [];

  constructor(
    private readonly outputs: OutputStep[] = [],
    private readonly spawnCodes: number[] = [],
    private readonly events?: string[],
  ) {}

  output(
    args: readonly string[],
    options: RecordedCall['options'],
  ): Promise<CommandOutput> {
    this.events?.push(`command:${args[0]}`);
    this.outputCalls.push({ args: [...args], options });
    const next = this.outputs.shift();
    if (!next) {
      throw new Error(`Unexpected output() call: ${args.join(' ')}`);
    }
    return typeof next === 'function' ? next(options) : Promise.resolve(next);
  }

  spawn(
    args: readonly string[],
    options: RecordedCall['options'],
  ): Promise<number> {
    this.spawnCalls.push({ args: [...args], options });
    const next = this.spawnCodes.shift();
    if (typeof next !== 'number') {
      throw new Error(`Unexpected spawn() call: ${args.join(' ')}`);
    }
    return Promise.resolve(next);
  }
}

class FakeAppHostLifecycleLock implements AppHostLifecycleLock {
  constructor(
    private readonly events: string[] = [],
    private readonly releaseError?: Error,
  ) {}

  acquire(): Promise<AppHostLifecycleLease> {
    this.events.push('lock:acquire');
    return Promise.resolve({
      release: () => {
        this.events.push('lock:release');
        return this.releaseError ? Promise.reject(this.releaseError) : Promise.resolve();
      },
    });
  }
}

const PROJECT_ROOT = 'C:\\repo\\sample-app';
const DATABASE: DiscoveredDatabase = {
  configKey: 'postgres',
  engine: 'postgres',
  databaseName: 'sample-app-db',
  workspaceDir: 'database/postgres',
  enabled: true,
};
const ASPIRE_CLI_START_TIMEOUT_ENV = 'ASPIRE_CLI_START_TIMEOUT';

function createRequest(
  operation: DbOperationRequest['operation'],
  overrides: Partial<DbOperationRequest> = {},
): DbOperationRequest {
  return {
    operation,
    target: { kind: 'single', database: DATABASE },
    projectRoot: PROJECT_ROOT,
    ...overrides,
  };
}

describe('DbOperationRunner', () => {
  it('runs one-shot operations through detached Aspire start and resource polling', async () => {
    await withAspireStartTimeout(undefined, async () => {
      const apphostPath = join(PROJECT_ROOT, 'aspire', 'db-operation', 'apphost.mts');
      const executor = createDetachedSuccessExecutor(apphostPath);
      const runner = createFastRunner(executor);

      const code = await runner.execute(
        createRequest('migrate', { migrationName: 'init' }),
      );

      assertEquals(code, 0);
      assertEquals(executor.spawnCalls.length, 0);
      assertEquals(commandNames(executor), [
        'describe',
        'start',
        'describe',
        'describe',
        'describe',
        'logs',
        'stop',
      ]);
      assertEquals(executor.outputCalls[0].args, [
        'describe',
        '--apphost',
        apphostPath,
        '--format',
        'Json',
        '--non-interactive',
        '--nologo',
      ]);
      assertEquals(executor.outputCalls[1].args[0], 'start');
      assertEquals(executor.outputCalls[1].args.includes('--isolated'), false);
      assertEquals(executor.outputCalls[1].args.includes(join(PROJECT_ROOT, 'aspire', 'apphost.mts')), false);
      assertEquals(executor.outputCalls[1].args.includes('--'), false);
      assertEquals(executor.outputCalls[5].args[0], 'logs');
      assertEquals(executor.outputCalls[6].args[0], 'stop');
      assertEquals(
        executor.outputCalls[1].options.env?.NETSCRIPT_PRISMA_OPERATION,
        'migrate',
      );
      assertEquals(
        executor.outputCalls[1].options.env?.NETSCRIPT_PRISMA_TARGET,
        'postgres',
      );
      assertEquals(
        executor.outputCalls[1].options.env?.NETSCRIPT_PRISMA_NAME,
        'init',
      );
      assertEquals(
        executor.outputCalls[1].options.env?.ASPIRE_CLI_START_TIMEOUT,
        '300',
      );
    });
  });

  it('preserves an operator-provided Aspire CLI start timeout', async () => {
    await withAspireStartTimeout('900', async () => {
      const apphostPath = join(PROJECT_ROOT, 'aspire', 'db-operation', 'apphost.mts');
      const executor = createDetachedSuccessExecutor(apphostPath);
      const runner = createFastRunner(executor);

      const code = await runner.execute(
        createRequest('migrate', { migrationName: 'init' }),
      );

      assertEquals(code, 0);
      assertEquals(
        executor.outputCalls[1].options.env?.ASPIRE_CLI_START_TIMEOUT,
        '900',
      );
    });
  });

  it('keeps polling when Aspire describe returns empty output during startup', async () => {
    await withAspireStartTimeout(undefined, async () => {
      const apphostPath = join(PROJECT_ROOT, 'aspire', 'db-operation', 'apphost.mts');
      const executor = new FakeAspireExecutor([
        noRunningAppHost(),
        { code: 0, stdout: '{"appHostPid":123}', stderr: '' },
        { code: 0, stdout: '', stderr: '' },
        {
          code: 0,
          stdout: JSON.stringify([
            {
              appHostPath: apphostPath,
              resources: [
                {
                  displayName: 'prisma-migrate-postgres',
                  resourceType: 'Executable',
                  state: 'Finished',
                  exitCode: 0,
                },
              ],
            },
          ]),
          stderr: '',
        },
        { code: 0, stdout: 'Migration applied.', stderr: '' },
        { code: 0, stdout: 'stopped', stderr: '' },
      ]);
      const runner = createFastRunner(executor);

      const code = await runner.execute(
        createRequest('migrate', { migrationName: 'init' }),
      );

      assertEquals(code, 0);
      assertEquals(executor.outputCalls[2].args[0], 'describe');
      assertEquals(executor.outputCalls[3].args[0], 'describe');
    });
  });

  it('uses the default Aspire CLI start timeout when the operator value is empty', async () => {
    await withAspireStartTimeout('', async () => {
      const apphostPath = join(PROJECT_ROOT, 'aspire', 'db-operation', 'apphost.mts');
      const executor = createDetachedSuccessExecutor(apphostPath);
      const runner = createFastRunner(executor);

      const code = await runner.execute(
        createRequest('migrate', { migrationName: 'init' }),
      );

      assertEquals(code, 0);
      assertEquals(
        executor.outputCalls[1].options.env?.ASPIRE_CLI_START_TIMEOUT,
        '300',
      );
    });
  });

  it('retires a pre-existing DB-operation AppHost before returning success', async () => {
    const apphostPath = join(PROJECT_ROOT, 'aspire', 'db-operation', 'apphost.mts');
    const executor = new FakeAspireExecutor([
      { code: 0, stdout: JSON.stringify([{ appHostPath: apphostPath }]), stderr: '' },
      { code: 0, stdout: 'stopped stale host', stderr: '' },
      { code: 0, stdout: '{"appHostPid":123}', stderr: '' },
      finishedResource(apphostPath, 0),
      { code: 0, stdout: 'Database is up to date.', stderr: '' },
      { code: 0, stdout: 'stopped', stderr: '' },
    ]);

    const code = await createFastRunner(executor).execute(createRequest('status'));

    assertEquals(code, 0);
    assertEquals(commandNames(executor), [
      'describe',
      'stop',
      'start',
      'describe',
      'logs',
      'stop',
    ]);
  });

  it('retires a pre-existing DB-operation AppHost when the operation fails', async () => {
    const apphostPath = join(PROJECT_ROOT, 'aspire', 'db-operation', 'apphost.mts');
    const executor = new FakeAspireExecutor([
      { code: 0, stdout: JSON.stringify([{ appHostPath: apphostPath }]), stderr: '' },
      { code: 0, stdout: 'stopped stale host', stderr: '' },
      { code: 0, stdout: '{"appHostPid":123}', stderr: '' },
      finishedResource(apphostPath, 1),
      { code: 0, stdout: 'No migration history.', stderr: '' },
      { code: 0, stdout: 'stopped', stderr: '' },
    ]);

    const code = await createFastRunner(executor).execute(createRequest('status'));

    assertEquals(code, 1);
    assertEquals(commandNames(executor), [
      'describe',
      'stop',
      'start',
      'describe',
      'logs',
      'stop',
    ]);
  });

  it('stops an AppHost started by this invocation after an operation failure', async () => {
    const apphostPath = join(PROJECT_ROOT, 'aspire', 'db-operation', 'apphost.mts');
    const executor = new FakeAspireExecutor([
      noRunningAppHost(),
      { code: 0, stdout: '{"appHostPid":123}', stderr: '' },
      finishedResource(apphostPath, 1),
      { code: 0, stdout: 'No migration history.', stderr: '' },
      { code: 0, stdout: 'stopped', stderr: '' },
    ]);

    const code = await createFastRunner(executor).execute(createRequest('status'));

    assertEquals(code, 1);
    assertEquals(commandNames(executor), ['describe', 'start', 'describe', 'logs', 'stop']);
  });

  it('stops the operation AppHost when a process signal aborts the command', async () => {
    const apphostPath = join(PROJECT_ROOT, 'aspire', 'db-operation', 'apphost.mts');
    let abortCommand: (() => void) | undefined;
    let unregistered = false;
    let verifiedAbsent = false;
    const executor = new FakeAspireExecutor([
      noRunningAppHost(),
      { code: 0, stdout: '{"appHostPid":123}', stderr: '' },
      (options) => {
        abortCommand?.();
        assertEquals(options.signal?.aborted, true);
        return Promise.reject(new DOMException('Signal received', 'AbortError'));
      },
      { code: 0, stdout: 'stopped', stderr: '' },
    ]);
    const runner = new DbOperationRunner({
      executor,
      lifecycleLock: new FakeAppHostLifecycleLock(),
      sleep: () => Promise.resolve(),
      writeOperationRequest: () => Promise.resolve(),
      removeOperationRequest: () => Promise.resolve(),
      ensureProcessStopped: () => Promise.resolve(),
      verifyAppHostAbsent: () => {
        verifiedAbsent = true;
        return Promise.resolve();
      },
      registerSignalAbort: (abort) => {
        abortCommand = abort;
        return () => {
          unregistered = true;
        };
      },
    });

    await assertRejects(() => runner.execute(createRequest('status')), DOMException, 'Signal received');

    assertEquals(commandNames(executor), ['describe', 'start', 'describe', 'stop']);
    assertEquals(verifiedAbsent, true);
    assertEquals(unregistered, true);
  });

  it('fails closed when the AppHost ownership probe is ambiguous', async () => {
    const events: string[] = [];
    const executor = new FakeAspireExecutor([
      { code: 2, stdout: '', stderr: 'Dashboard connection failed.' },
    ], [], events);

    await assertRejects(
      () => createFastRunner(executor, new FakeAppHostLifecycleLock(events)).execute(
        createRequest('status'),
      ),
      Error,
      'aspire describe failed with exit code 2: Dashboard connection failed.',
    );

    assertEquals(commandNames(executor), ['describe']);
    assertEquals(events, ['lock:acquire', 'command:describe', 'lock:release']);
  });

  it('does not let a lock release failure mask the operation error', async () => {
    const executor = new FakeAspireExecutor([
      { code: 2, stdout: '', stderr: 'Dashboard connection failed.' },
    ]);

    await assertRejects(
      () =>
        createFastRunner(
          executor,
          new FakeAppHostLifecycleLock([], new Error('release failed')),
        ).execute(createRequest('status')),
      Error,
      'aspire describe failed with exit code 2: Dashboard connection failed.',
    );
  });

  it('fails closed when another error quotes the no-running-AppHost phrase', async () => {
    const executor = new FakeAspireExecutor([
      {
        code: 3,
        stdout: '',
        stderr:
          "Dashboard failed after reporting: No AppHost is currently running for 'apphost.mts'.",
      },
    ]);

    await assertRejects(
      () => createFastRunner(executor).execute(createRequest('status')),
      Error,
      'aspire describe failed with exit code 3: Dashboard failed after reporting:',
    );
    assertEquals(commandNames(executor), ['describe']);
  });

  it('includes the exit code when an Aspire command fails without details', async () => {
    const executor = new FakeAspireExecutor([
      noRunningAppHost(),
      { code: 9, stdout: '', stderr: '' },
    ]);

    await assertRejects(
      () => createFastRunner(executor).execute(createRequest('status')),
      Error,
      'aspire start failed with exit code 9: unknown Aspire error',
    );
  });

  it('keeps studio interactive and passes db cli mode through environment variables', async () => {
    const executor = new FakeAspireExecutor([], [0]);
    const runner = new DbOperationRunner({ executor });

    const code = await runner.execute(createRequest('studio'));

    assertEquals(code, 0);
    assertEquals(executor.outputCalls.length, 0);
    assertEquals(executor.spawnCalls.length, 1);
    assertEquals(executor.spawnCalls[0].args[0], 'run');
    assertEquals(executor.spawnCalls[0].args.includes('--isolated'), false);
    assertEquals(executor.spawnCalls[0].args.includes('--'), false);
    assertEquals(
      executor.spawnCalls[0].options.env?.NETSCRIPT_PRISMA_OPERATION,
      'studio',
    );
    assertEquals(
      executor.spawnCalls[0].options.env?.NETSCRIPT_PRISMA_TARGET,
      'postgres',
    );
  });
});

function createFastRunner(
  executor: FakeAspireExecutor,
  lifecycleLock: AppHostLifecycleLock = new FakeAppHostLifecycleLock(),
): DbOperationRunner {
  return new DbOperationRunner({
    executor,
    lifecycleLock,
    pollIntervalMs: 0,
    timeoutMs: 100,
    sleep: async () => {},
    writeOperationRequest: () => Promise.resolve(),
    removeOperationRequest: () => Promise.resolve(),
    ensureProcessStopped: () => Promise.resolve(),
    verifyAppHostAbsent: () => Promise.resolve(),
    registerSignalAbort: () => () => {},
  });
}

function createDetachedSuccessExecutor(apphostPath: string): FakeAspireExecutor {
  return new FakeAspireExecutor([
    noRunningAppHost(),
    { code: 0, stdout: '{"appHostPid":123}', stderr: '' },
    { code: 0, stdout: '[]', stderr: '' },
    {
      code: 0,
      stdout: JSON.stringify([
        {
          appHostPath: apphostPath,
          resources: [
            {
              displayName: 'prisma-migrate-postgres',
              resourceType: 'Executable',
              state: 'Running',
              exitCode: null,
            },
          ],
        },
      ]),
      stderr: '',
    },
    {
      code: 0,
      stdout: JSON.stringify([
        {
          appHostPath: apphostPath,
          resources: [
            {
              displayName: 'prisma-migrate-postgres',
              resourceType: 'Executable',
              state: 'Finished',
              exitCode: 0,
            },
          ],
        },
      ]),
      stderr: '',
    },
    { code: 0, stdout: 'Migration applied.', stderr: '' },
    { code: 0, stdout: 'stopped', stderr: '' },
  ]);
}

function noRunningAppHost(): CommandOutput {
  return {
    code: 1,
    stdout: '',
    stderr: "No AppHost is currently running for 'apphost.mts'.",
  };
}

function finishedResource(apphostPath: string, exitCode: number): CommandOutput {
  return {
    code: 0,
    stdout: JSON.stringify([
      {
        appHostPath: apphostPath,
        resources: [
          {
            displayName: 'prisma-status-postgres',
            resourceType: 'Executable',
            state: 'Finished',
            exitCode,
          },
        ],
      },
    ]),
    stderr: '',
  };
}

function commandNames(executor: FakeAspireExecutor): string[] {
  return executor.outputCalls.map((call) => call.args[0]);
}

async function withAspireStartTimeout(
  value: string | undefined,
  action: () => Promise<void>,
): Promise<void> {
  const previous = Deno.env.get(ASPIRE_CLI_START_TIMEOUT_ENV);
  try {
    if (value === undefined) {
      Deno.env.delete(ASPIRE_CLI_START_TIMEOUT_ENV);
    } else {
      Deno.env.set(ASPIRE_CLI_START_TIMEOUT_ENV, value);
    }
    await action();
  } finally {
    if (previous === undefined) {
      Deno.env.delete(ASPIRE_CLI_START_TIMEOUT_ENV);
    } else {
      Deno.env.set(ASPIRE_CLI_START_TIMEOUT_ENV, previous);
    }
  }
}
