import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { retry } from '@std/async';
import { join, toFileUrl } from '@std/path';
import { z } from 'zod';
import { RedisAdapter } from '@netscript/queue/adapters/redis';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { SCAFFOLD_CACHE_CONTAINER_IMAGES } from '../../../../constants/scaffold/scaffold-container-images.ts';
import { generateRegisterInfrastructure } from '../register/generate-register-infrastructure.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

async function loadCompatBindMountHelpers(): Promise<{
  readonly ensureContainerDataPath: (dataPath: string) => string;
  readonly resolveContainerBindMountRuntimeArgs: (
    options?: {
      readonly platform?: string;
      readonly getUid?: (() => number) | null;
      readonly getGid?: (() => number) | null;
      readonly isRootless?: () => boolean;
    },
  ) => string[];
  readonly cleanup: () => Promise<void>;
}> {
  const root = await Deno.makeTempDir({ prefix: 'netscript-garnet-compat-' });
  const source = await Deno.readTextFile(
    new URL('../../../../assets/aspire/helpers/_aspire-compat.ts.template', import.meta.url),
  );
  await Deno.mkdir(join(root, '.aspire/modules'), { recursive: true });
  await Deno.writeTextFile(
    join(root, '.aspire/modules/aspire.mts'),
    "export const HealthStatus = { Healthy: 'Healthy', Unhealthy: 'Unhealthy' };\n",
  );
  await Deno.mkdir(join(root, '.helpers'));
  const compatPath = join(root, '.helpers/_aspire-compat.mts');
  await Deno.writeTextFile(
    compatPath,
    source.replace("from 'zod';", `from '${import.meta.resolve('zod')}';`),
  );
  const mod = await import(toFileUrl(compatPath).href);
  return {
    ensureContainerDataPath: mod.ensureContainerDataPath,
    resolveContainerBindMountRuntimeArgs: mod.resolveContainerBindMountRuntimeArgs,
    cleanup: () => Deno.remove(root, { recursive: true }),
  };
}

function generate(mode: 'Container' | 'Executable' | 'Auto', dataPath?: string): string {
  return generateRegisterInfrastructure({
    databases: {},
    caches: { garnet: { Enabled: true, Engine: 'Garnet', Mode: mode, DataPath: dataPath } },
  });
}

for (const mode of ['Container', 'Executable', 'Auto'] as const) {
  Deno.test(`Garnet ${mode} with DataPath enables flushed AOF and recovery`, () => {
    const source = generate(mode, '.data/garnet');
    for (
      const flag of [
        '--aof',
        '--aof-commit-freq',
        '--aof-commit-wait',
        '--recover',
        '--storage-tier',
        '--device-type',
      ]
    ) {
      assertStringIncludes(source, flag);
      assertEquals(source.split(JSON.stringify(flag)).length - 1, mode === 'Auto' ? 2 : 1);
    }
    assertStringIncludes(source, 'FileStream');
    assertStringIncludes(source, '--logdir');
    assertStringIncludes(source, '--checkpointdir');
    assertStringIncludes(source, 'resolveDataPath(appHostDir, ".data/garnet", "garnet")');
    if (mode !== 'Executable') {
      assertStringIncludes(source, "'/data'");
      const match = /\.withArgs\((\[[^\n]+\])\)/.exec(source);
      assert(match);
      const args = z.array(z.string()).parse(JSON.parse(match[1]));
      for (const flag of ['--logdir', '--checkpointdir']) {
        assertEquals(args[args.indexOf(flag) + 1], '/data');
      }
      assertEquals(args[args.indexOf('--aof-commit-freq') + 1], '0');
      assertEquals(args[args.indexOf('--device-type') + 1], 'FileStream');
      assertStringIncludes(
        source,
        'ensureContainerDataPath(resolveDataPath(appHostDir, ".data/garnet", "garnet"))',
      );
      assertStringIncludes(source, 'resolveContainerBindMountRuntimeArgs()');
      assertStringIncludes(source, 'await cache_0.withContainerRuntimeArgs(cache_0_runtimeArgs);');
      assert(/import\s*\{[^}]*\bensureContainerDataPath\b/.test(source));
      assert(/import\s*\{[^}]*\bresolveContainerBindMountRuntimeArgs\b/.test(source));
    } else {
      assertEquals(source.includes('ensureContainerDataPath'), false);
      assertEquals(source.includes('resolveContainerBindMountRuntimeArgs'), false);
    }
    if (mode !== 'Container') assert(/import\s*\{[^}]*\bresolveDataPath\b/.test(source));
  });

  Deno.test(`Garnet ${mode} without DataPath preserves ephemeral arguments`, () => {
    const source = generate(mode);
    assertStringIncludes(source, '--lua');
    assertStringIncludes(source, '--lua-transaction-mode');
    for (
      const flag of [
        '--aof',
        '--recover',
        '--logdir',
        '--checkpointdir',
        '--storage-tier',
        '--device-type',
      ]
    ) {
      assertEquals(source.includes(flag), false);
    }
    assertEquals(source.includes('ensureContainerDataPath'), false);
    assertEquals(source.includes('resolveContainerBindMountRuntimeArgs'), false);
    if (mode !== 'Executable') {
      assertStringIncludes(source, '.withArgs(["--lua","--lua-transaction-mode"])');
    }
  });
}

Deno.test('compat bind-mount helpers prepare host data dir and compute Linux user runtime args', async () => {
  const {
    ensureContainerDataPath,
    resolveContainerBindMountRuntimeArgs,
    cleanup,
  } = await loadCompatBindMountHelpers();
  const dataRoot = await Deno.makeTempDir({ prefix: 'netscript-garnet-data-' });
  try {
    const nested = join(dataRoot, '.data', 'garnet');
    assertEquals(ensureContainerDataPath(nested), nested);
    assert((await Deno.stat(nested)).isDirectory);
    // Idempotent when already present.
    assertEquals(ensureContainerDataPath(nested), nested);

    assertEquals(
      resolveContainerBindMountRuntimeArgs({
        platform: 'win32',
        getUid: () => 1001,
        getGid: () => 1001,
        isRootless: () => false,
      }),
      [],
    );
    assertEquals(
      resolveContainerBindMountRuntimeArgs({
        platform: 'darwin',
        getUid: () => 1001,
        getGid: () => 1001,
        isRootless: () => false,
      }),
      [],
    );
    assertEquals(
      resolveContainerBindMountRuntimeArgs({
        platform: 'linux',
        getUid: null,
        getGid: null,
        isRootless: () => false,
      }),
      [],
    );
    assertEquals(
      resolveContainerBindMountRuntimeArgs({
        platform: 'linux',
        getUid: () => 1001,
        getGid: () => 127,
        isRootless: () => false,
      }),
      ['--user', '1001:127'],
    );
    assertEquals(
      resolveContainerBindMountRuntimeArgs({
        platform: 'linux',
        getUid: () => 1001,
        getGid: () => 127,
        isRootless: () => true,
      }),
      ['--user', '0:0'],
    );
  } finally {
    await cleanup();
    await Deno.remove(dataRoot, { recursive: true });
  }
});

async function docker(...args: string[]): Promise<string> {
  const result = await new Deno.Command('docker', { args, stdout: 'piped', stderr: 'piped' })
    .output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
  return new TextDecoder().decode(result.stdout).trim();
}

async function command(hostname: string, port: number, value: 'PING' | 'SAVE'): Promise<string> {
  const connection = await Deno.connect({ hostname, port });
  const timer = setTimeout(() => connection.close(), 5_000);
  try {
    const encoded = new TextEncoder().encode(`*1\r\n$${value.length}\r\n${value}\r\n`);
    let written = 0;
    while (written < encoded.length) written += await connection.write(encoded.subarray(written));
    const bytes = new Uint8Array(512);
    let reply = '';
    while (!reply.includes('\r\n')) {
      const length = await connection.read(bytes);
      assert(length !== null, 'Garnet closed before its reply.');
      reply += new TextDecoder().decode(bytes.subarray(0, length));
    }
    return reply.split('\r\n')[0];
  } finally {
    clearTimeout(timer);
    try {
      connection.close();
    } catch { /* The owned timeout already closed this connection. */ }
  }
}

for (const checkpoint of [false, true]) {
  Deno.test({
    name: `generated Garnet DataPath launch delivers ${
      checkpoint ? 'checkpoint and AOF-tail' : 'AOF-only'
    } jobs after restart`,
    ignore: Deno.env.get('NETSCRIPT_TEST_GARNET_DOCKER') !== '1',
    async fn() {
      const source = generate('Container', '.data/garnet');
      const match = /\.withArgs\((\[[^\n]+\])\)/.exec(source);
      assert(match, 'The generated container must supply native argv.');
      const args = z.array(z.string()).parse(JSON.parse(match[1]));
      const image = SCAFFOLD_CACHE_CONTAINER_IMAGES.Garnet;
      const owner = crypto.randomUUID();
      const label = `netscript.test-owner=${owner}`;
      let volume: string | undefined;
      let container: string | undefined;
      let producer: RedisAdapter<{ id: string }> | undefined;
      let consumer: RedisAdapter<{ id: string }> | undefined;
      let phase = 'initial readiness';
      try {
        volume = await docker('volume', 'create', '--label', label);
        // A uniquely owned volume supplies the same persistent /data boundary as
        // DataPath's generated bind mount, including on remote Docker daemons.
        container = await docker(
          'create',
          '--label',
          label,
          '--mount',
          `type=volume,source=${volume},target=/data`,
          '--publish',
          '0.0.0.0::6379',
          `${image.image}:${image.tag}`,
          ...args,
        );
        await docker('start', container);
        const binding = (await docker('port', container, '6379/tcp')).split('\n')[0];
        let port = Number(binding.slice(binding.lastIndexOf(':') + 1));
        const daemon = Deno.env.get('DOCKER_HOST');
        const hostname = daemon?.startsWith('tcp://') ? new URL(daemon).hostname : '127.0.0.1';
        let url = `redis://${hostname}:${port}`;
        const ready = () =>
          retry(async () => {
            assertEquals(await command(hostname, port, 'PING'), '+PONG');
          }, { maxAttempts: 200, minTimeout: 100, maxTimeout: 100, jitter: 0 });
        await ready();
        const name = `persistence-${owner}`;
        producer = new RedisAdapter(url, name);
        await producer.enqueue({ id: 'checkpoint' });
        if (checkpoint) assertEquals(await command(hostname, port, 'SAVE'), '+OK');
        await producer.enqueue({ id: 'aof-tail' });
        assertEquals((await producer.getHealth()).ready, 2);
        // The server cannot flush during graceful stop; acknowledged writes must
        // already be recoverable. Restart with the exact emitted native argv.
        await docker('kill', '--signal', 'KILL', container);
        await producer.stop();
        await docker('start', container);
        phase = 'restart readiness';
        const restartedBinding = (await docker('port', container, '6379/tcp')).split('\n')[0];
        port = Number(restartedBinding.slice(restartedBinding.lastIndexOf(':') + 1));
        url = `redis://${hostname}:${port}`;
        await ready();
        phase = 'recovered delivery';
        consumer = new RedisAdapter(url, name);
        const delivered: string[] = [];
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5_000);
        try {
          await consumer.listen(async (message, context) => {
            await context.ack();
            delivered.push(message.id);
            if (delivered.length === 2) controller.abort();
          }, { signal: controller.signal, concurrency: 1, visibilityTimeout: 1_000 });
        } finally {
          clearTimeout(timer);
          controller.abort();
        }
        assertEquals(delivered, ['checkpoint', 'aof-tail']);
        assertEquals((await consumer.getHealth()).ready, 0);
      } catch (cause) {
        const diagnostic = container ? await docker('logs', container) : 'container not created';
        throw new Error(
          `Garnet restart probe failed during ${phase}. Server output: ${diagnostic}`,
          {
            cause,
          },
        );
      } finally {
        await consumer?.stop();
        await producer?.stop();
        // Immutable IDs and unique labels prove ownership before each mutation.
        if (container) {
          assertEquals(
            await docker(
              'inspect',
              '--format',
              '{{index .Config.Labels "netscript.test-owner"}}',
              container,
            ),
            owner,
          );
          await docker('rm', '--force', container);
        }
        if (volume) {
          assertEquals(
            await docker(
              'volume',
              'inspect',
              '--format',
              '{{index .Labels "netscript.test-owner"}}',
              volume,
            ),
            owner,
          );
          await docker('volume', 'rm', volume);
        }
      }
    },
  });
}

Deno.test({
  name:
    'generated Garnet DataPath bind mount on Linux fails as default non-root UID and recovers with host UID runtime args',
  ignore: Deno.env.get('NETSCRIPT_TEST_GARNET_DOCKER') !== '1',
  async fn() {
    const { resolveContainerBindMountRuntimeArgs, cleanup } = await loadCompatBindMountHelpers();
    const source = generate('Container', '.data/garnet');
    const match = /\.withArgs\((\[[^\n]+\])\)/.exec(source);
    assert(match, 'The generated container must supply native argv.');
    const args = z.array(z.string()).parse(JSON.parse(match[1]));
    const image = SCAFFOLD_CACHE_CONTAINER_IMAGES.Garnet;
    const owner = crypto.randomUUID();
    const label = `netscript.test-owner=${owner}`;
    const hostBindPath = `/tmp/netscript-garnet-bind-${owner}`;
    let negativeContainer: string | undefined;
    let positiveContainer: string | undefined;
    let producer: RedisAdapter<{ id: string }> | undefined;
    let consumer: RedisAdapter<{ id: string }> | undefined;
    try {
      // Prepare a daemon-side directory owned by non-root Linux host UID 1001:1001 (0755),
      // mirroring GitHub Actions ubuntu-latest and standard Linux developer checkouts.
      await docker(
        'run',
        '--rm',
        '--label',
        label,
        '-v',
        `${hostBindPath}:/hostdata`,
        'alpine:latest',
        'sh',
        '-c',
        'chown 1001:1001 /hostdata && chmod 755 /hostdata',
      );

      // Negative control: without the generated Linux runtime --user args, Garnet 2.2.14 (UID 1654)
      // fails immediately on the host-owned bind mount.
      negativeContainer = await docker(
        'create',
        '--label',
        label,
        '--mount',
        `type=bind,source=${hostBindPath},target=/data`,
        `${image.image}:${image.tag}`,
        ...args,
      );
      await docker('start', negativeContainer);
      await retry(async () => {
        const status = await docker('inspect', '--format', '{{.State.Status}}', negativeContainer!);
        assertEquals(status, 'exited');
      }, { maxAttempts: 50, minTimeout: 100, maxTimeout: 100, jitter: 0 });
      const negativeLogs = await docker('logs', negativeContainer);
      assertStringIncludes(negativeLogs, "Access to the path '/data/Store' is denied");

      // Positive control: applying the exact generated runtime args lets Garnet write, survive
      // hard kill + restart, and keep bind-mounted files removable by host UID 1001.
      const runtimeArgs = resolveContainerBindMountRuntimeArgs({
        platform: 'linux',
        getUid: () => 1001,
        getGid: () => 1001,
        isRootless: () => false,
      });
      assertEquals(runtimeArgs, ['--user', '1001:1001']);
      positiveContainer = await docker(
        'create',
        '--label',
        label,
        ...runtimeArgs,
        '--mount',
        `type=bind,source=${hostBindPath},target=/data`,
        '--publish',
        '0.0.0.0::6379',
        `${image.image}:${image.tag}`,
        ...args,
      );
      await docker('start', positiveContainer);
      const daemon = Deno.env.get('DOCKER_HOST');
      const hostname = daemon?.startsWith('tcp://') ? new URL(daemon).hostname : '127.0.0.1';
      const resolveUrl = async () => {
        const binding = (await docker('port', positiveContainer!, '6379/tcp')).split('\n')[0];
        const port = Number(binding.slice(binding.lastIndexOf(':') + 1));
        await retry(async () => {
          assertEquals(await command(hostname, port, 'PING'), '+PONG');
        }, { maxAttempts: 200, minTimeout: 100, maxTimeout: 100, jitter: 0 });
        return `redis://${hostname}:${port}`;
      };

      const queueName = `bind-persistence-${owner}`;
      producer = new RedisAdapter(await resolveUrl(), queueName);
      await producer.enqueue({ id: 'bind-aof-job' });
      assertEquals((await producer.getHealth()).ready, 1);

      await docker('kill', '--signal', 'KILL', positiveContainer);
      await producer.stop();
      await docker('start', positiveContainer);

      consumer = new RedisAdapter(await resolveUrl(), queueName);
      const delivered: string[] = [];
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      try {
        await consumer.listen(async (message, context) => {
          await context.ack();
          delivered.push(message.id);
          controller.abort();
        }, { signal: controller.signal, concurrency: 1, visibilityTimeout: 1_000 });
      } finally {
        clearTimeout(timer);
        controller.abort();
      }
      assertEquals(delivered, ['bind-aof-job']);
    } finally {
      await consumer?.stop();
      await producer?.stop();
      for (const id of [negativeContainer, positiveContainer]) {
        if (id) {
          assertEquals(
            await docker(
              'inspect',
              '--format',
              '{{index .Config.Labels "netscript.test-owner"}}',
              id,
            ),
            owner,
          );
          await docker('rm', '--force', id);
        }
      }
      // Prove host UID 1001 owns and can clean up all Garnet persistence files without root,
      // then remove the temporary daemon-side mount directory.
      await docker(
        'run',
        '--rm',
        '--user',
        '1001:1001',
        '--label',
        label,
        '-v',
        `${hostBindPath}:/hostdata`,
        'alpine:latest',
        'sh',
        '-c',
        'rm -rf /hostdata/*',
      );
      await docker(
        'run',
        '--rm',
        '--label',
        label,
        '-v',
        '/tmp:/hosttmp',
        'alpine:latest',
        'rmdir',
        `/hosttmp/netscript-garnet-bind-${owner}`,
      );
      await cleanup();
    }
  },
});
