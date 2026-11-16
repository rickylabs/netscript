import { assertEquals } from '@std/assert';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

for (const hangs of [false, true]) {
  Deno.test({
    name: `child SIGTERM closes Redis and exits after ${hangs ? 'timed-out' : 'clean'} drain`,
    ignore: !redisUrl || Deno.build.os === 'windows',
    async fn() {
      const child = new Deno.Command(Deno.execPath(), {
        args: [
          'eval',
          '--unstable-kv',
          `
          import '@netscript/kv/redis';
          import { getKv, closeKv } from '@netscript/kv';
          import { runChildHealthProcess } from '@netscript/plugin/health';
          await runChildHealthProcess(async (health, signal) => {
            await (await getKv({ provider: 'redis', redisUrl: Deno.env.get('NETSCRIPT_TEST_REDIS_URL'), skipServiceDiscovery: true })).get(['shutdown-probe']);
            health.registryLoaded(); health.dependenciesReady(); health.running();
            console.log('PROBE_READY');
            await new Promise(resolve => signal.addEventListener('abort', resolve, { once: true }));
            if (${hangs}) await new Promise(() => {});
          }, undefined, {
            drainTimeoutMs: 100,
            onShutdown: [async () => { await closeKv(); console.log('PROBE_CLOSED'); }],
          });
        `,
        ],
        env: { PORT: '0' },
        stdout: 'piped',
        stderr: 'piped',
      }).spawn();
      let output = '';
      const reading = (async () => {
        const decoder = new TextDecoder();
        for await (const chunk of child.stdout) output += decoder.decode(chunk, { stream: true });
      })();
      let killed = false;
      let exited = false;
      const statusPromise = child.status.then((status) => {
        exited = true;
        return status;
      });
      const stderr = child.stderr.pipeThrough(new TextDecoderStream()).getReader();
      const errors = (async () => {
        let text = '';
        for (;;) {
          const result = await stderr.read();
          if (result.done) return text;
          text += result.value;
        }
      })();
      const timer = setTimeout(() => {
        killed = true;
        try {
          child.kill('SIGKILL');
        } catch { /* Already exited. */ }
      }, 5_000);
      try {
        while (!output.includes('PROBE_READY') && !killed && !exited) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        assertEquals(
          output.includes('PROBE_READY'),
          true,
          await (exited ? errors : Promise.resolve('child did not become ready')),
        );
        if (!killed && !exited) child.kill('SIGTERM');
        const status = await statusPromise;
        await reading;
        assertEquals(killed, false, 'child exceeded its shutdown deadline');
        assertEquals(status.code, hangs ? 2 : 0);
        assertEquals(output.includes('PROBE_CLOSED'), true, 'owned Redis connection was closed');
      } finally {
        clearTimeout(timer);
        try {
          child.kill('SIGKILL');
        } catch { /* Already exited. */ }
        await child.status;
        await reading;
        await errors;
      }
    },
  });
}
