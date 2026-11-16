import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';
import { runtimeGlueStub as workers } from '../../../../plugins/workers/src/adapter/resources/glue/runtime.stub.ts';
import { runtimeGlueStub as sagas } from '../../../../plugins/sagas/src/adapter/resources/glue/runtime.stub.ts';
import { runtimeGlueStub as triggers } from '../../../../plugins/triggers/src/adapter/resources/glue/runtime.stub.ts';

const CONFIG = fromFileUrl(new URL('../../../../deno.json', import.meta.url));

for (const [plugin, runtime] of Object.entries({ workers, sagas, triggers })) {
  for (const hostname of [undefined, '0.0.0.0']) {
    const expectedHostname = hostname ?? '127.0.0.1';
    Deno.test({
      name: `generated ${plugin} health binds ${
        hostname ?? 'loopback by default'
      } and serves its probe`,
      ignore: Deno.build.os === 'windows',
      async fn() {
        const root = await Deno.makeTempDir();
        const probe = `${root}/probe.ts`;
        await Deno.writeTextFile(`${root}/runtime.ts`, runtime.source);
        await Deno.writeTextFile(
          `${root}/registry.ts`,
          "throw new Error('Bind probe bootstrap');\n",
        );
        // Intercept only the native HTTP boundary. Execute the actual generated
        // entrypoint; readiness of its job/database bootstrap is outside this bind test.
        await Deno.writeTextFile(
          probe,
          `const serve = Deno.serve;
Deno.serve = (...args) => {
  const server = serve(...args);
  void (async () => {
    const target = ${JSON.stringify(expectedHostname)} === '0.0.0.0'
      ? Deno.networkInterfaces().find((entry) => entry.family === 'IPv4' && !entry.address.startsWith('127.'))?.address
      : '127.0.0.1';
    if (!target) throw new Error('A non-loopback IPv4 interface is required for this probe.');
    const response = await fetch('http://' + target + ':' + server.addr.port + '/health');
    await response.json();
    console.log('HEALTH_BIND:' + JSON.stringify({ hostname: server.addr.hostname, status: response.status }));
    Deno.exit(0);
  })().catch((error) => { console.error(error); Deno.exit(1); });
  return server;
};
`,
        );
        const env: Record<string, string> = {
          ...Deno.env.toObject(),
          PORT: '0',
          CACHE_PROVIDER: 'denokv',
          DENO_KV_URL: `${root}/runtime.kv`,
          NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE: '',
          NETSCRIPT_WORKERS_REGISTRY_MODULE: `${root}/registry.ts`,
          SAGAS_REGISTRY_MODULE: `${root}/registry.ts`,
          NETSCRIPT_TRIGGER_REGISTRY_MODULE: `${root}/registry.ts`,
        };
        delete env.NETSCRIPT_CHILD_HEALTH_HOSTNAME;
        if (hostname !== undefined) env.NETSCRIPT_CHILD_HEALTH_HOSTNAME = hostname;
        const child = new Deno.Command(Deno.execPath(), {
          args: [
            'run',
            '--no-check',
            '--allow-all',
            '--unstable-kv',
            '--preload',
            probe,
            '--config',
            CONFIG,
            `${root}/runtime.ts`,
          ],
          cwd: root,
          clearEnv: true,
          env,
          stdout: 'piped',
          stderr: 'piped',
        }).spawn();
        const timer = setTimeout(() => {
          try {
            child.kill('SIGKILL');
          } catch { /* The owned child already exited. */ }
        }, 15_000);
        try {
          const result = await child.output();
          assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
          const report = new TextDecoder().decode(result.stdout).split('\n').find((line) =>
            line.startsWith('HEALTH_BIND:')
          );
          assertEquals(JSON.parse(report?.slice('HEALTH_BIND:'.length) ?? 'null'), {
            hostname: expectedHostname,
            status: 503,
          });
        } finally {
          clearTimeout(timer);
          await Deno.remove(root, { recursive: true });
        }
      },
    });
  }
}
