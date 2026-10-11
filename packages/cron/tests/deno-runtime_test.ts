import { assertEquals } from '@std/assert';

Deno.test({
  name: 'Deno real runtime fires translated UTC weekdays and uses day constraint OR',
  ignore: Deno.env.get('NETSCRIPT_CRON_RUNTIME_PROBE') !== '1',
  async fn() {
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), 140_000);
    try {
      const result = await new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--unstable-cron',
          new URL('./fixtures/deno-weekday-probe.ts', import.meta.url).pathname,
        ],
        signal: controller.signal,
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
      console.log(new TextDecoder().decode(result.stdout).trim());
    } finally {
      clearTimeout(deadline);
    }
  },
});
