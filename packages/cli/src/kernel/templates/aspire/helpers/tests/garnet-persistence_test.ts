import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import { retry } from '@std/async';
import { z } from 'zod';
import { RedisAdapter } from '@netscript/queue/adapters/redis';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { SCAFFOLD_CACHE_CONTAINER_IMAGES } from '../../../../constants/scaffold/scaffold-container-images.ts';
import { generateRegisterInfrastructure } from '../register/generate-register-infrastructure.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

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
    if (mode !== 'Executable') {
      assertStringIncludes(source, '.withArgs(["--lua","--lua-transaction-mode"])');
    }
  });
}

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
