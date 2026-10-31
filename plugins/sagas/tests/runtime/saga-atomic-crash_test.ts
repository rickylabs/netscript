import { assert, assertEquals } from '@std/assert';
import { stderrTail } from '../../../../packages/plugin-sagas-core/tests/fixtures/transition-store/provider-process.ts';

const fixture = new URL('./fixtures/atomic-crash-process.ts', import.meta.url);
for (const backend of ['kv', 'redis']) {
  for (const phase of ['crash', 'orphan']) {
    Deno.test({
      name: `production saga supervisor ${backend} ${
        phase === 'crash'
          ? 'SIGKILL after handler before commit redelivers once'
          : 'ignores orphaned legacy reservations'
      }`,
      ignore: backend === 'redis' && !Deno.env.get('NETSCRIPT_TEST_REDIS_URL'),
      async fn() {
        const root = await Deno.makeTempDir();
        const namespace = 'atomic-saga-' + crypto.randomUUID();
        const args = (
          mode: string,
        ) => [
          'run',
          '--frozen',
          '--unstable-kv',
          '-A',
          fixture.pathname,
          backend,
          root,
          mode,
          namespace,
        ];
        try {
          if (phase === 'crash') {
            const child = new Deno.Command(Deno.execPath(), {
              args: args('crash'),
              stdin: 'null',
              stdout: 'piped',
              stderr: 'piped',
            }).spawn();
            const errors = stderrTail(child.stderr);
            const reader = child.stdout.pipeThrough(new TextDecoderStream()).getReader();
            let output = '';
            const deadline = setTimeout(() => {
              try {
                child.kill('SIGKILL');
              } catch { /* Already exited. */ }
            }, 30_000);
            try {
              while (!output.includes('PAUSED_AFTER_HANDLER')) {
                const part = await reader.read();
                if (part.done) throw new Error('Crash child exited before pause: ' + await errors);
                output += part.value;
              }
              child.kill('SIGKILL');
              const status = await child.status;
              assertEquals(status.signal, 'SIGKILL');
            } finally {
              clearTimeout(deadline);
              try {
                child.kill('SIGKILL');
              } catch { /* Already reaped. */ }
              await child.status;
              await reader.cancel();
              reader.releaseLock();
              await errors;
            }
          }
          const resumed = await new Deno.Command(Deno.execPath(), {
            args: args(phase === 'orphan' ? 'orphan' : 'resume'),
            stdin: 'null',
            stdout: 'piped',
            stderr: 'piped',
            signal: AbortSignal.timeout(30_000),
          }).output();
          assertEquals(resumed.code, 0, new TextDecoder().decode(resumed.stderr));
          const result = JSON.parse(new TextDecoder().decode(resumed.stdout).trim());
          assert(result.envelope, 'redelivery must not be swallowed by an orphaned reservation');
          assertEquals(result.envelope.state, { count: 1 });
          assertEquals(result.envelope.metadata.version, 1);
          assertEquals(result.history.length, 1);
          assertEquals(result.history[0].version, 1);
          const calls = (await Deno.readTextFile(root + '/calls.txt')).trim().split('\n');
          assertEquals(calls.length, phase === 'crash' ? 2 : 1);
        } finally {
          await Deno.remove(root, { recursive: true });
        }
      },
    });
  }
}
