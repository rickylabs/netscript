import { kill } from 'node:process';
import { spawnSync } from 'node:child_process';

/** Independent of the production timer and cleanup: a broken deadline must fail the test suite. */
const FIXTURE_WATCHDOG_MS = 5_000;

async function reapFixtureGroups(root: string): Promise<void> {
  // These records are written by fixtures before executing their potentially nonterminating body.
  for await (const entry of Deno.readDir(root)) {
    const group = Number(await Deno.readTextFile(`${root}/${entry.name}`));
    if (!Number.isSafeInteger(group) || group <= 0) throw new Error('invalid fixture ownership');
    if (Deno.build.os === 'windows') {
      spawnSync('taskkill', ['/PID', String(group), '/T', '/F'], {
        stdio: 'ignore',
        timeout: 1_000,
      });
    } else {
      try {
        kill(-group, 'SIGKILL');
      } catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'ESRCH')) throw error;
      }
    }
  }
}

/** Record only test-owned groups, then reap them even when the production timeout is disabled. */
export async function withFixtureWatchdog(
  test: (fixture: (body: string) => string) => Promise<void>,
): Promise<void> {
  const root = await Deno.makeTempDir({ prefix: 'snippet-watchdog-' });
  let count = 0;
  const fixture = (body: string) => {
    const record = `${root}/${count++}`;
    return `Deno.writeTextFileSync(${JSON.stringify(record)}, String(Deno.pid));\n${body}`;
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const pending = test(fixture);
  try {
    await Promise.race([
      pending,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new Error(`independent fixture watchdog exceeded ${FIXTURE_WATCHDOG_MS}ms`)),
          FIXTURE_WATCHDOG_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
    await reapFixtureGroups(root);
    // Drain the original operation after reaping, so failed tests leave no pending ops or timers.
    await pending.catch(() => {});
    await Deno.remove(root, { recursive: true });
  }
}
