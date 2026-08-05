/** @module infra/database/operation-runner_test */

import { join } from '@std/path';
import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import { DbOperationRunner } from './operation-runner.ts';
import type { AppHostLifecycleLease, AppHostLifecycleLock } from './apphost-lifecycle-lock.ts';
import type { DbOperationRequest, DiscoveredDatabase } from '../../domain/db-engine.ts';

interface CommandOutput { readonly code: number; readonly stdout: string; readonly stderr: string }
interface RecordedCall {
  readonly args: readonly string[];
  readonly options: { readonly cwd: string; readonly env?: Record<string, string>; readonly signal?: AbortSignal };
}
type OutputStep = CommandOutput | ((options: RecordedCall['options']) => Promise<CommandOutput>);

class FakeAspireExecutor {
  readonly outputCalls: RecordedCall[] = [];
  readonly spawnCalls: RecordedCall[] = [];
  constructor(private readonly outputs: OutputStep[] = [], private readonly spawnCodes: number[] = []) {}
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
  configKey: 'postgres', engine: 'postgres', databaseName: 'sample-app-db',
  workspaceDir: 'database/postgres', enabled: true,
};

function request(operation: DbOperationRequest['operation']): DbOperationRequest {
  return { operation, target: { kind: 'single', database: DATABASE }, projectRoot: PROJECT_ROOT };
}

function resource(exitCode = 0): CommandOutput {
  return { code: 0, stderr: '', stdout: JSON.stringify([{ appHostPath: APPHOST, resources: [{
    displayName: 'netscript-db-postgres', resourceType: 'Executable', state: 'Finished', exitCode,
  }] }]) };
}

function runner(executor: FakeAspireExecutor, registerSignalAbort = (_abort: () => void) => () => {}) {
  return new DbOperationRunner({
    executor, lifecycleLock: new FakeLock(), pollIntervalMs: 0, timeoutMs: 100,
    sleep: async () => {}, writeOperationRequest: () => Promise.resolve(),
    removeOperationRequest: () => Promise.resolve(), registerSignalAbort,
  });
}

describe('DbOperationRunner', () => {
  it('uses the resident explicit-start resource and never starts a second AppHost', async () => {
    const executor = new FakeAspireExecutor([
      { code: 0, stdout: '[]', stderr: '' },
      { code: 0, stdout: '', stderr: '' }, resource(),
      { code: 0, stdout: 'migration complete', stderr: '' },
      { code: 0, stdout: '', stderr: '' },
    ]);
    assertEquals(await runner(executor).execute(request('migrate')), 0);
    assertEquals(executor.outputCalls.some((call) => call.args[0] === 'start'), false);
    assertEquals(executor.outputCalls[1].args.slice(0, 3), ['resource', 'netscript-db-postgres', 'start']);
    assertEquals(executor.outputCalls.at(-1)?.args.slice(0, 3), ['resource', 'netscript-db-postgres', 'stop']);
    assertEquals(executor.outputCalls.every((call) => !call.args.join(' ').includes('db-operation/apphost.mts')), true);
  });

  it('fails closed when the resident AppHost is absent without starting a resource', async () => {
    const executor = new FakeAspireExecutor([{
      code: 1, stdout: '', stderr: "No AppHost is currently running for 'apphost.mts'.",
    }]);
    await assertRejects(() => runner(executor).execute(request('seed')), Error, 'resident Aspire AppHost is not running');
    assertEquals(executor.outputCalls.map((call) => call.args[0]), ['describe']);
  });

  it('stops the resident operation resource when the database task fails', async () => {
    const executor = new FakeAspireExecutor([
      { code: 0, stdout: '[]', stderr: '' }, { code: 0, stdout: '', stderr: '' }, resource(7),
      { code: 0, stdout: 'failed', stderr: '' }, { code: 0, stdout: '', stderr: '' },
    ]);
    assertEquals(await runner(executor).execute(request('status')), 7);
    assertEquals(executor.outputCalls.at(-1)?.args.slice(0, 3), ['resource', 'netscript-db-postgres', 'stop']);
  });

  it('stops the resource when a signal aborts polling', async () => {
    let abort: (() => void) | undefined;
    const executor = new FakeAspireExecutor([
      { code: 0, stdout: '[]', stderr: '' }, { code: 0, stdout: '', stderr: '' },
      (options) => { abort?.(); return Promise.reject(options.signal?.reason); },
      { code: 0, stdout: '', stderr: '' },
    ]);
    await assertRejects(
      () => runner(executor, (handler) => { abort = handler; return () => {}; }).execute(request('seed')),
      DOMException,
    );
    assertEquals(executor.outputCalls.at(-1)?.args.slice(0, 3), ['resource', 'netscript-db-postgres', 'stop']);
  });

  it('keeps studio attached to the resident AppHost', async () => {
    const executor = new FakeAspireExecutor([], [0]);
    assertEquals(await runner(executor).execute(request('studio')), 0);
    assertEquals(executor.spawnCalls[0].args[0], 'run');
    assertEquals(executor.spawnCalls[0].args.includes(APPHOST), true);
  });
});
