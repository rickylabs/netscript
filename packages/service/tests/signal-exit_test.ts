import { assertEquals } from '@std/assert';

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');

for (const hangs of [false, true]) {
  Deno.test({
    name: `service SIGTERM closes Redis and Prisma clients and exits after ${
      hangs ? 'timed-out' : 'clean'
    } drain`,
    ignore: !redisUrl || Deno.build.os === 'windows',
    async fn() {
      const child = new Deno.Command(Deno.execPath(), {
        args: [
          'eval',
          '--unstable-kv',
          `
          import '@netscript/kv/redis';
          import { getKv, closeKv } from '@netscript/kv';
          import { createService } from '@netscript/service';
          await (await getKv({ provider: 'redis', redisUrl: Deno.env.get('NETSCRIPT_TEST_REDIS_URL'), skipServiceDiscovery: true })).get(['shutdown-probe']);
          const client = { $queryRaw: async () => [], $disconnect: async () => { console.log('PROBE_DB_CLOSED'); } };
          await createService({}, { name: 'shutdown-probe' })
            .withDatabase({ first: client, alias: client })
            .onShutdown(async () => { if (${hangs}) await new Promise(() => {}); })
            .serve({ port: 0, drainTimeoutMs: 100 });
          console.log('PROBE_READY');
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
        assertEquals(
          output.split('PROBE_DB_CLOSED').length - 1,
          1,
          'acquired Prisma client closed once despite aliases',
        );
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
