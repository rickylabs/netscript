/** @module infra/database/operation-runner_test */

import { join } from '@std/path';
import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import type { DbOperationRequest, DiscoveredDatabase } from '../../domain/db-engine.ts';
import type { AppHostLifecycleLease, AppHostLifecycleLock } from './apphost-lifecycle-lock.ts';
import { DbOperationRunner } from './operation-runner.ts';

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
  ) {}

  output(args: readonly string[], options: RecordedCall['options']): Promise<CommandOutput> {
    this.outputCalls.push({ args: [...args], options });
    const next = this.outputs.shift();
    if (!next) throw new Error(`Unexpected output() call: ${args.join(' ')}`);
    return typeof next === 'function' ? next(options) : Promise.resolve(next);
  }

  spawn(args: readonly string[], options: RecordedCall['options']): Promise<number> {
    this.spawnCalls.push({ args: [...args], options });
    const next = this.spawnCodes.shift();
    if (next === undefined) throw new Error(`Unexpected spawn() call: ${args.join(' ')}`);
    return Promise.resolve(next);
  }
}

class FakeLock implements AppHostLifecycleLock {
  acquire(): Promise<AppHostLifecycleLease> {
    return Promise.resolve({ release: () => Promise.resolve() });
  }
}

const PROJECT_ROOT = 'C:\\repo\\sample-app';
const APPHOST = join(PROJECT_ROOT, 'aspire', 'apphost.mts');
const DATABASE: DiscoveredDatabase = {
  configKey: 'postgres',
  engine: 'postgres',
  databaseName: 'sample-app-db',
  workspaceDir: 'database/postgres',
  enabled: true,
};

function request(
  operation: DbOperationRequest['operation'],
  migrationName?: string,
): DbOperationRequest {
  return {
    operation,
    target: { kind: 'single', database: DATABASE },
    projectRoot: PROJECT_ROOT,
    migrationName,
  };
}

function output(code = 0, stdout = '', stderr = ''): CommandOutput {
  return { code, stdout, stderr };
}

function running(path = APPHOST): CommandOutput {
  return output(0, JSON.stringify([{ appHostPath: path, appHostPid: 42 }]));
}

function completedResource(exitCode = 0): CommandOutput {
  return output(
    0,
    JSON.stringify([{
      appHostPath: APPHOST,
      resources: [{
        displayName: 'postgres-cli',
        resourceType: 'Executable',
        state: 'Finished',
        exitCode,
      }],
    }]),
  );
}

function runner(
  executor: FakeAspireExecutor,
  options: {
    readonly writeOperationRequest?: (path: string, env: Record<string, string>) => Promise<void>;
    readonly registerSignalAbort?: (abort: () => void) => () => void;
  } = {},
): DbOperationRunner {
  return new DbOperationRunner({
    executor,
    lifecycleLock: new FakeLock(),
    pollIntervalMs: 0,
    timeoutMs: 60_000,
    sleep: async () => {},
    writeOperationRequest: options.writeOperationRequest ?? (() => Promise.resolve()),
    removeOperationRequest: () => Promise.resolve(),
    registerSignalAbort: options.registerSignalAbort ?? (() => () => {}),
  });
}

describe('DbOperationRunner', () => {
  it('matches the project AppHost and routes migrate through its typed resource command', async () => {
    const executor = new FakeAspireExecutor([
      running(),
      output(),
      output(0, '{"success":true,"message":"ok"}'),
    ]);

    assertEquals(await runner(executor).execute(request('migrate')), 0);
    assertEquals(executor.outputCalls.map((call) => call.args[0]), ['ps', 'wait', 'resource']);
    assertEquals(executor.outputCalls[0].args, [
      'ps',
      '--format',
      'Json',
      '--nologo',
      '--non-interactive',
    ]);
    assertEquals(executor.outputCalls[1].args, [
      'wait',
      'postgres',
      '--status',
      'healthy',
      '--timeout',
      '60',
      '--apphost',
      APPHOST,
      '--non-interactive',
      '--nologo',
    ]);
    assertEquals(executor.outputCalls[2].args, [
      'resource',
      'postgres-cli',
      'migrate',
      '--timeout',
      '60',
      '--apphost',
      APPHOST,
      '--non-interactive',
      '--nologo',
    ]);
    assertEquals(executor.outputCalls.some((call) => call.args[0] === 'start'), false);
  });

  it('starts and stops one scoped project AppHost when no matching AppHost is running', async () => {
    const executor = new FakeAspireExecutor([
      output(0, '[]'),
      output(0, '{"appHostPid":43}'),
      output(),
      output(0, '{"success":true,"message":"ok"}'),
      output(),
    ]);

    assertEquals(await runner(executor).execute(request('seed')), 0);
    assertEquals(executor.outputCalls.map((call) => call.args[0]), [
      'ps',
      'start',
      'wait',
      'resource',
      'stop',
    ]);
    assertEquals(executor.outputCalls[1].args, [
      'start',
      '--apphost',
      APPHOST,
      '--format',
      'Json',
      '--non-interactive',
      '--isolated',
      '--nologo',
    ]);
  });

  it('does not treat another project AppHost as the resident project', async () => {
    const executor = new FakeAspireExecutor([
      running('C:\\repo\\another\\aspire\\apphost.mts'),
      output(),
      output(),
      output(),
      output(),
    ]);

    assertEquals(await runner(executor).execute(request('seed')), 0);
    assertEquals(executor.outputCalls[1].args[0], 'start');
    assertEquals(executor.outputCalls.at(-1)?.args[0], 'stop');
  });

  it('passes destructive confirmation to the typed reset command', async () => {
    const executor = new FakeAspireExecutor([running(), output(), output()]);

    assertEquals(await runner(executor).execute(request('reset')), 0);
    const resourceArgs = executor.outputCalls[2].args;
    assertEquals(resourceArgs.slice(0, 3), ['resource', 'postgres-cli', 'reset']);
    assertEquals(resourceArgs.slice(5, 7), ['--confirm', 'true']);
  });

  for (const exitCode of [17, 18]) {
    it(`maps aspire wait exit ${exitCode} to an actionable bounded-readiness error`, async () => {
      const executor = new FakeAspireExecutor([
        running(),
        output(exitCode, '', 'resource remains unhealthy'),
      ]);

      const error = await assertRejects(
        () => runner(executor).execute(request('init', 'init')),
        Error,
        `Database resource postgres did not become healthy within 60 seconds (aspire wait exit ${exitCode})`,
      );
      assertStringIncludes(error.message, 'Check its resource logs and listener readiness');
      assertEquals(executor.outputCalls.map((call) => call.args[0]), ['ps', 'wait']);
    });
  }

  it('reports non-timeout wait failures without misclassifying them', async () => {
    const executor = new FakeAspireExecutor([
      running(),
      output(9, '', 'authentication failed'),
    ]);

    await assertRejects(
      () => runner(executor).execute(request('seed')),
      Error,
      'aspire wait failed with exit code 9: authentication failed',
    );
  });

  it('keeps migration-name operations on the explicit-start compatibility resource', async () => {
    let requestEnv: Record<string, string> | undefined;
    const executor = new FakeAspireExecutor([
      running(),
      output(),
      output(),
      completedResource(),
      output(0, 'migration complete'),
      output(),
    ]);

    assertEquals(
      await runner(executor, {
        writeOperationRequest: (_path, env) => {
          requestEnv = env;
          return Promise.resolve();
        },
      }).execute(request('migrate', 'add-profile')),
      0,
    );
    assertEquals(requestEnv?.PRISMA_MIGRATION_NAME, 'add-profile');
    assertEquals(executor.outputCalls.map((call) => call.args[0]), [
      'ps',
      'wait',
      'resource',
      'describe',
      'logs',
      'resource',
    ]);
    assertEquals(executor.outputCalls[2].args.slice(0, 3), [
      'resource',
      'postgres-cli',
      'start',
    ]);
    assertEquals(executor.outputCalls.at(-1)?.args.slice(0, 3), [
      'resource',
      'postgres-cli',
      'stop',
    ]);
  });

  it('returns a typed resource command failure without restarting the resident AppHost', async () => {
    const executor = new FakeAspireExecutor([
      running(),
      output(),
      output(7, '', 'migration failed'),
    ]);

    assertEquals(await runner(executor).execute(request('migrate')), 7);
    assertEquals(executor.outputCalls.some((call) => call.args[0] === 'start'), false);
    assertEquals(executor.outputCalls.some((call) => call.args[0] === 'stop'), false);
  });

  it('keeps studio attached to the project AppHost', async () => {
    const executor = new FakeAspireExecutor([], [0]);

    assertEquals(await runner(executor).execute(request('studio')), 0);
    assertEquals(executor.spawnCalls[0].args[0], 'run');
    assertEquals(executor.spawnCalls[0].args.includes(APPHOST), true);
  });
});
