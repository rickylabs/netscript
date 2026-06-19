/**
 * @module infra/database/operation-runner_test
 */

import { join } from '@std/path';
import { assertEquals } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import { DbOperationRunner } from './operation-runner.ts';
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
  };
}

class FakeAspireExecutor {
  readonly outputCalls: RecordedCall[] = [];
  readonly spawnCalls: RecordedCall[] = [];

  constructor(
    private readonly outputs: CommandOutput[] = [],
    private readonly spawnCodes: number[] = [],
  ) {}

  output(
    args: readonly string[],
    options: RecordedCall['options'],
  ): Promise<CommandOutput> {
    this.outputCalls.push({ args: [...args], options });
    const next = this.outputs.shift();
    if (!next) {
      throw new Error(`Unexpected output() call: ${args.join(' ')}`);
    }
    return Promise.resolve(next);
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
      const apphostPath = join(PROJECT_ROOT, 'aspire', 'apphost.mts');
      const executor = createDetachedSuccessExecutor(apphostPath);
      const runner = createFastRunner(executor);

      const code = await runner.execute(
        createRequest('migrate', { migrationName: 'init' }),
      );

      assertEquals(code, 0);
      assertEquals(executor.spawnCalls.length, 0);
      assertEquals(executor.outputCalls.length, 6);
      assertEquals(executor.outputCalls[0].args[0], 'start');
      assertEquals(executor.outputCalls[0].args.includes('--isolated'), false);
      assertEquals(executor.outputCalls[0].args.includes('--'), false);
      assertEquals(executor.outputCalls[1].args, [
        'describe',
        '--apphost',
        apphostPath,
        '--format',
        'Json',
        '--non-interactive',
        '--nologo',
      ]);
      assertEquals(executor.outputCalls[4].args[0], 'logs');
      assertEquals(executor.outputCalls[5].args[0], 'stop');
      assertEquals(
        executor.outputCalls[0].options.env?.NETSCRIPT_PRISMA_OPERATION,
        'migrate',
      );
      assertEquals(
        executor.outputCalls[0].options.env?.NETSCRIPT_PRISMA_TARGET,
        'postgres',
      );
      assertEquals(
        executor.outputCalls[0].options.env?.NETSCRIPT_PRISMA_NAME,
        'init',
      );
      assertEquals(
        executor.outputCalls[0].options.env?.ASPIRE_CLI_START_TIMEOUT,
        '300',
      );
    });
  });

  it('preserves an operator-provided Aspire CLI start timeout', async () => {
    await withAspireStartTimeout('900', async () => {
      const apphostPath = join(PROJECT_ROOT, 'aspire', 'apphost.mts');
      const executor = createDetachedSuccessExecutor(apphostPath);
      const runner = createFastRunner(executor);

      const code = await runner.execute(
        createRequest('migrate', { migrationName: 'init' }),
      );

      assertEquals(code, 0);
      assertEquals(
        executor.outputCalls[0].options.env?.ASPIRE_CLI_START_TIMEOUT,
        '900',
      );
    });
  });

  it('uses the default Aspire CLI start timeout when the operator value is empty', async () => {
    await withAspireStartTimeout('', async () => {
      const apphostPath = join(PROJECT_ROOT, 'aspire', 'apphost.mts');
      const executor = createDetachedSuccessExecutor(apphostPath);
      const runner = createFastRunner(executor);

      const code = await runner.execute(
        createRequest('migrate', { migrationName: 'init' }),
      );

      assertEquals(code, 0);
      assertEquals(
        executor.outputCalls[0].options.env?.ASPIRE_CLI_START_TIMEOUT,
        '300',
      );
    });
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

function createFastRunner(executor: FakeAspireExecutor): DbOperationRunner {
  return new DbOperationRunner({
    executor,
    pollIntervalMs: 0,
    timeoutMs: 100,
    sleep: async () => {},
  });
}

function createDetachedSuccessExecutor(apphostPath: string): FakeAspireExecutor {
  return new FakeAspireExecutor([
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
