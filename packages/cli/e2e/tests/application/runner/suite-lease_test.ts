import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { SCAFFOLD } from '../../../src/domain/cli-surface.ts';
import {
  createSuiteLeaseManager,
  SUITE_LEASE_STALE_CHECK,
  SuiteLeaseContentionError,
  type SuiteLeaseFileSystem,
  type SuiteLeaseRecord,
} from '../../../src/application/runner/suite-lease.ts';

const LEASE_PATH = '/tmp/netscript-e2e-test.lease';

Deno.test('second acquire refuses while the recorded holder pid is alive', async () => {
  const fileSystem = new MemoryLeaseFileSystem();
  const holder = leaseManager(fileSystem, { pid: 4242, processAlive: true });
  await holder.acquire(SCAFFOLD.RUNTIME, '/worktrees/holder');

  const contender = leaseManager(fileSystem, { pid: 5252, processAlive: true });
  const error = await assertRejects(
    () => contender.acquire(SCAFFOLD.RUNTIME, '/worktrees/contender'),
    SuiteLeaseContentionError,
  );
  assertStringIncludes(error.message, 'pid 4242');
  assertStringIncludes(error.message, LEASE_PATH);
  assertStringIncludes(error.message, '/worktrees/holder');
});

Deno.test('dead holder is declared stale, removed, and replaced', async () => {
  const fileSystem = new MemoryLeaseFileSystem();
  fileSystem.content = JSON.stringify(leaseRecord(4040));
  const notices: string[] = [];
  const manager = leaseManager(fileSystem, {
    pid: 6262,
    processAlive: false,
    notices,
  });

  const lease = await manager.acquire(SCAFFOLD.RUNTIME, '/worktrees/replacement');

  assertEquals(fileSystem.removals, 1);
  assertStringIncludes(notices[0], 'pid 4040 is dead');
  assertStringIncludes(notices[0], SUITE_LEASE_STALE_CHECK);
  assertEquals(JSON.parse(fileSystem.content ?? '').pid, 6262);
  await lease.release();
});

function leaseRecord(pid: number): SuiteLeaseRecord {
  return {
    pid,
    startedAt: '2026-08-03T20:00:00.000Z',
    suiteId: SCAFFOLD.RUNTIME,
    worktree: '/worktrees/holder',
  };
}

function leaseManager(
  fileSystem: MemoryLeaseFileSystem,
  options: Readonly<{
    pid: number;
    processAlive: boolean;
    notices?: string[];
  }>,
) {
  return createSuiteLeaseManager({
    fileSystem,
    isProcessAlive: () => options.processAlive,
    leasePath: LEASE_PATH,
    now: () => new Date('2026-08-03T21:00:00.000Z'),
    pid: options.pid,
    notice: (message) => options.notices?.push(message),
  });
}

class MemoryLeaseFileSystem implements SuiteLeaseFileSystem {
  content: string | undefined;
  removals = 0;

  createExclusive(_path: string, content: string): Promise<boolean> {
    if (this.content !== undefined) return Promise.resolve(false);
    this.content = content;
    return Promise.resolve(true);
  }

  readText(): Promise<string> {
    if (this.content === undefined) return Promise.reject(new Error('lease missing'));
    return Promise.resolve(this.content);
  }

  remove(): Promise<void> {
    this.content = undefined;
    this.removals += 1;
    return Promise.resolve();
  }
}
