import { dirname, join } from '@std/path';
import { assertEquals } from 'jsr:@std/assert@^1';

import {
  FileAppHostLifecycleLock,
  resolveAppHostLifecycleLockPath,
} from './apphost-lifecycle-lock.ts';

Deno.test('FileAppHostLifecycleLock reclaims a lock held by a dead process', async () => {
  const root = await Deno.makeTempDir();
  try {
    const apphostPath = join(root, 'aspire', 'apphost.mts');
    const lockPath = await resolveAppHostLifecycleLockPath(apphostPath);
    await Deno.mkdir(dirname(lockPath), { recursive: true });
    await Deno.writeTextFile(
      lockPath,
      JSON.stringify({
        pid: 424242,
        acquiredAt: '2026-08-01T00:00:00.000Z',
        token: 'dead-holder',
      }),
    );
    let sleepCalls = 0;
    const lock = new FileAppHostLifecycleLock({
      pid: 7,
      now: () => new Date('2026-08-01T00:00:01.000Z'),
      isProcessAlive: () => false,
    });

    const lease = await lock.acquire(apphostPath, {
      timeoutMs: 60_000,
      pollIntervalMs: 10,
      sleep: () => {
        sleepCalls++;
        return Promise.resolve();
      },
    });

    const record = JSON.parse(await Deno.readTextFile(lockPath));
    assertEquals(record.pid, 7);
    assertEquals(sleepCalls, 0);
    await lease.release();
    assertEquals(await pathExists(lockPath), false);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}
