import { assertEquals } from '@std/assert';
import { runtimeGlueStub } from '../../src/adapter/resources/glue/runtime.stub.ts';
import { readChildHealth } from '../../../../packages/cli/src/kernel/adapters/aspire/child-health-reader.ts';
import { stderrTail } from '../../../../packages/plugin-sagas-core/tests/fixtures/transition-store/provider-process.ts';

Deno.test('generated saga child boots the default KV store with a valid ready health payload', async () => {
  const root = await Deno.makeTempDir();
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const port = (listener.addr as Deno.NetAddr).port;
  listener.close();
  const config = new URL('../../../../deno.json', import.meta.url).pathname;
  await Deno.writeTextFile(root + '/runtime.ts', runtimeGlueStub.source);
  await Deno.writeTextFile(
    root + '/registry.ts',
    "import { defineSaga } from '@netscript/plugin-sagas-core';\n" +
      "export const definitions = [defineSaga('health-proof').state({ count: 0 }).on('start', () => []).build()];\n",
  );
  const child = new Deno.Command(Deno.execPath(), {
    args: ['run', '--frozen', '--unstable-kv', '-A', '--config', config, root + '/runtime.ts'],
    cwd: root,
    env: {
      CACHE_PROVIDER: 'denokv',
      DENO_KV_URL: root + '/runtime.kv',
      KV_URL: root + '/runtime.kv',
      NETSCRIPT_SAGA_KV_PATH: root + '/runtime.kv',
      SAGAS_REGISTRY_MODULE: new URL('file://' + root + '/registry.ts').href,
      PORT: String(port),
    },
    stdin: 'null',
    stdout: 'null',
    stderr: 'piped',
  }).spawn();
  const errors = stderrTail(child.stderr);
  let status: Deno.CommandStatus | undefined;
  const exited = child.status.then((value) => status = value);
  const endpoint = `http://127.0.0.1:${port}`;
  try {
    const deadline = Date.now() + 15_000;
    let health;
    do {
      health = await readChildHealth(endpoint, fetch);
      if (health?.state === 'ready') break;
      if (status) throw new Error('Saga child exited: ' + await errors);
      await new Promise((resolve) => setTimeout(resolve, 25));
    } while (Date.now() < deadline);
    assertEquals(health, {
      state: 'ready',
      registryReady: true,
      dependencyReady: true,
      restartCount: 0,
      lastFatalError: null,
    });
  } finally {
    if (!status) child.kill('SIGKILL');
    await exited;
    await errors;
    await Deno.remove(root, { recursive: true });
  }
});
