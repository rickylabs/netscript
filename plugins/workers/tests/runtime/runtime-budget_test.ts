import { assertEquals } from '@std/assert';
import { fromFileUrl, join } from '@std/path';

for (const mode of ['worker', 'combined']) {
  for (
    const [configured, override, expected] of [[50, undefined, false], [1_800, undefined, true], [
      50,
      1_800,
      true,
    ], [1_800, 50, false]] as const
  ) {
    Deno.test(`${mode} runtime forwards authored grace ${configured} and explicit override ${override ?? 'omitted'}`, async () => {
      const root = await Deno.makeTempDir({ prefix: 'worker-budget-' });
      let child: Deno.ChildProcess | undefined;
      try {
        await Deno.writeTextFile(
          join(root, 'netscript.config.ts'),
          `export default ${
            JSON.stringify({
              name: 'budget-test',
              databases: { config: [] },
              workers: { drainTimeoutMs: 4_000, abortGracePeriodMs: configured },
            })
          };`,
        );
        await Deno.writeTextFile(
          join(root, 'job.ts'),
          `export default async ({signal}) => {
await new Promise(resolve => signal.addEventListener('abort', resolve, {once:true}));
await new Promise(resolve => setTimeout(resolve, 1250));
await Deno.writeTextFile('cleaned', 'yes');
return {success:true};
};`,
        );
        const config = fromFileUrl(new URL('../../../../deno.json', import.meta.url));
        const fixture = fromFileUrl(new URL('./_fixtures/budget-process.ts', import.meta.url));
        const env: Record<string, string> = {
          ...Deno.env.toObject(),
          KV_URL: join(root, 'runtime.sqlite'),
        };
        for (const key of Object.keys(env)) {
          if (/redis|garnet|rabbitmq|^NETSCRIPT_PROJECT_ROOT$|^OTEL_/i.test(key)) delete env[key];
        }
        child = new Deno.Command(Deno.execPath(), {
          args: [
            'run',
            '--no-lock',
            '--allow-all',
            '--unstable-kv',
            '--config',
            config,
            fixture,
            mode,
            ...(override === undefined ? [] : [String(override)]),
          ],
          cwd: root,
          env,
          clearEnv: true,
          stdout: 'piped',
          stderr: 'piped',
        }).spawn();
        const timer = setTimeout(() => {
          try {
            child?.kill('SIGKILL');
          } catch { /* already exited */ }
        }, 15_000);
        let result: Deno.CommandOutput;
        try {
          result = await child.output();
        } finally {
          clearTimeout(timer);
        }
        const output = new TextDecoder().decode(result.stdout);
        assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
        const line = output.split('\n').find((line) => line.startsWith('{"probe":"worker-budget"'));
        assertEquals(line && JSON.parse(line), {
          probe: 'worker-budget',
          cleaned: expected,
          status: 'timeout',
        }, output + new TextDecoder().decode(result.stderr));
      } finally {
        await Deno.remove(root, { recursive: true });
      }
    });
  }
}
