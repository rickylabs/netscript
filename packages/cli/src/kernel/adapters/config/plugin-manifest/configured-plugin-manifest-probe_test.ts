import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { dirname, join, relative } from '@std/path';
import type { ProcessPort, ProcessResult } from '../../../ports/process-port.ts';
import { DenoProcess } from '../../runtime/process/deno-process.ts';
import {
  type ConfiguredPluginManifestProbeResult,
  probeConfiguredPluginManifest,
} from './configured-plugin-manifest-probe.ts';

const SOURCE = "export default { name: '@fixture/probe', version: '1.0.0', contributions: {} };\n";
const CHILD = new URL('./configured-plugin-manifest-probe-child.ts', import.meta.url).href;
const encoder = new TextEncoder();

Deno.test('manifest probe owns one frozen scratch lock until each ProcessPort outcome settles', async () => {
  await withProject(async (root) => {
    await prepareLock(root);
    const before = await snapshot(root);
    for (
      const outcome of [
        'resolved',
        'missing',
        'ambiguous',
        'import-failure',
        'malformed-payload',
        'non-zero',
        'timeout',
        'throw',
      ] as const
    ) {
      let scratch = '';
      let calls = 0;
      const process: ProcessPort = {
        async exec(command, args, options): Promise<ProcessResult> {
          calls++;
          assertEquals(command, Deno.execPath());
          assertEquals(options?.cwd, root);
          assertEquals(options?.timeoutMs, 3_000);
          for (
            const flag of [
              '--frozen',
              '--node-modules-dir=none',
              '--allow-read',
              '--allow-env',
              '--allow-net',
              '--deny-write',
              '--deny-run',
              '--no-prompt',
            ]
          ) {
            assert(args.includes(flag), flag);
          }
          assertEquals(args.includes('--no-lock'), false);
          assertEquals(args.some((arg) => arg.startsWith('--minimum-dependency-age')), false);
          scratch = args.find((arg) => arg.startsWith('--lock='))!.slice(7);
          assertEquals(await Deno.readFile(scratch), await Deno.readFile(join(root, 'deno.lock')));
          assertEquals(scratch.startsWith(root), false);
          if (outcome === 'throw') throw new Error('settled adapter failure');
          if (outcome === 'timeout') return { code: 1, stdout: '', stderr: '', timedOut: true };
          if (outcome === 'non-zero') return { code: 9, stdout: '', stderr: 'fixture exit' };
          const payload = outcome === 'resolved'
            ? {
              schemaVersion: 1,
              status: 'resolved',
              resolvedSpecifier: new URL('./plugin.ts', import.meta.url).href,
              manifest: { name: '@fixture/probe', version: '1.0.0' },
            }
            : { schemaVersion: 1, status: outcome, count: 2, message: 'fixture failure' };
          return {
            code: 0,
            stdout: 'NETSCRIPT_PLUGIN_MANIFEST_PROBE=' +
              (outcome === 'malformed-payload' ? '{invalid' : JSON.stringify(payload)) + '\n',
            stderr: '',
          };
        },
      };
      const run = () =>
        probeConfiguredPluginManifest(root, './plugin.ts', process, {
          denoCommand: Deno.execPath(),
        });
      if (outcome === 'throw') await assertRejects(run, Error, 'settled adapter failure');
      else assertEquals((await run()).status, outcome);
      assertEquals(calls, 1);
      await assertRejects(() => Deno.stat(dirname(scratch)), Deno.errors.NotFound);
      assertEquals(await snapshot(root), before);
    }
  });
});

Deno.test('missing disabled malformed and linked lock inputs fail before executing a module', async () => {
  for (const config of [undefined, '{}', '{"lock":false}', '{invalid', 'null']) {
    await withProject(async (root) => {
      await prepareLock(root);
      if (config === undefined) await Deno.remove(join(root, 'deno.json'));
      else await Deno.writeTextFile(join(root, 'deno.json'), config);
      if (config === '{}') await Deno.remove(join(root, 'deno.lock'));
      let executed = false;
      const result = await probeConfiguredPluginManifest(root, './plugin.ts', {
        exec() {
          executed = true;
          throw new Error('must not execute');
        },
      });
      assertEquals(result.status, 'import-failure');
      if (result.status === 'import-failure') {
        assertStringIncludes(result.message, 'generate plugins');
      }
      assertEquals(executed, false);
    });
  }
  await withProject(async (root) => {
    await prepareLock(root);
    await Deno.mkdir(join(root, 'actual'));
    await Deno.copyFile(join(root, 'deno.lock'), join(root, 'actual/consumer.lock'));
    await Deno.symlink(join(root, 'actual'), join(root, 'linked'), {
      type: Deno.build.os === 'windows' ? 'junction' : 'dir',
    });
    await Deno.writeTextFile(join(root, 'deno.json'), '{"lock":"linked/consumer.lock"}');
    const result = await probe(root);
    assertEquals(result.status, 'import-failure');
    if (result.status === 'import-failure') assertStringIncludes(result.message, 'Linked paths');
  });
});

Deno.test('manifest preparation rejects malformed lock selection before plugin execution', async () => {
  for (const lock of [123, [], null, { path: 7 }]) {
    await withProject(async (root) => {
      await prepareLock(root);
      await Deno.writeTextFile(join(root, 'deno.json'), JSON.stringify({ lock }));
      await Deno.writeTextFile(
        join(root, 'plugin.ts'),
        `console.log('MODULE_SIDE_EFFECT');\n${SOURCE}`,
      );
      const before = await snapshot(root);
      const result = await probe(root);
      assertEquals(result.status, 'import-failure', JSON.stringify(lock));
      if (result.status === 'import-failure') {
        assertStringIncludes(result.message, 'lock');
        assertStringIncludes(result.message, 'generate plugins');
        assertEquals(result.message.includes('MODULE_SIDE_EFFECT'), false);
      }
      assertEquals(await snapshot(root), before);
    });
  }
});

Deno.test('frozen scratch lock retains relative workspace authority permissions and concurrent isolation', async () => {
  await withProject(async (root) => {
    await Deno.mkdir(join(root, 'member'));
    await Deno.writeTextFile(
      join(root, 'member/deno.json'),
      JSON.stringify({ name: '@fixture/member', version: '1.0.0', exports: './plugin.ts' }),
    );
    await Deno.writeTextFile(join(root, 'member/helper.ts'), 'export const version = "1.0.0";\n');
    await Deno.writeTextFile(
      join(root, 'member/plugin.ts'),
      `import {version} from './helper.ts';
for (const attempt of [() => Deno.writeTextFile(${
        JSON.stringify(join(root, 'forbidden'))
      }, 'write'), () => new Deno.Command(Deno.execPath()).output()]) {
  try { await attempt(); throw new Error('inspection permission escaped'); } catch (error) { if (!(error instanceof Deno.errors.NotCapable)) throw error; }
}
export default {name:'@fixture/probe', version, contributions:{}};\n`,
    );
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({ workspace: ['./member'], nodeModulesDir: 'auto' }),
    );
    await Deno.mkdir(join(root, 'node_modules'));
    await Deno.writeTextFile(join(root, 'node_modules/sentinel'), 'consumer-owned\n');
    await prepareLock(root);
    const before = await snapshot(root);
    const locks: string[] = [];
    const native = new DenoProcess();
    const process: ProcessPort = {
      exec(command, args, options) {
        locks.push(args.find((arg) => arg.startsWith('--lock='))!.slice(7));
        return native.exec(command, args, options);
      },
    };
    const results = await Promise.all(
      Array.from(
        { length: 4 },
        () =>
          probeConfiguredPluginManifest(root, '@fixture/member', process, {
            denoCommand: Deno.execPath(),
          }),
      ),
    );
    assertEquals(results.map((result) => result.status), [
      'resolved',
      'resolved',
      'resolved',
      'resolved',
    ]);
    assertEquals(new Set(locks).size, 4);
    for (const path of locks) {
      await assertRejects(() => Deno.stat(dirname(path)), Deno.errors.NotFound);
    }
    assertEquals(await snapshot(root), before);
  });
});

Deno.test('incomplete frozen lock cannot execute a plugin side effect', async () => {
  await withProject(async (root) => {
    await prepareLock(root);
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({ imports: { fixture: 'npm:netscript-never-prepared-fixture@1.0.0' } }),
    );
    await Deno.writeTextFile(
      join(root, 'plugin.ts'),
      `import 'fixture'; console.log('MODULE_SIDE_EFFECT');\n${SOURCE}`,
    );
    const result = await probe(root, true);
    assertEquals(result.status, 'non-zero');
    if (result.status === 'non-zero') {
      assertStringIncludes(result.message, 'lock');
      assertEquals(result.message.includes('MODULE_SIDE_EFFECT'), false);
    }
  });
});

Deno.test('configured npm manifest resolves cached-only from exact locked files without registry metadata', async () => {
  const started = Date.now();
  await withProject(async (root) => {
    const cacheA = join(dirname(root), 'cache-a');
    const cacheB = join(dirname(root), 'cache-b');
    const archive = await npmArchive();
    const integrity = 'sha512-' +
      btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-512', archive))));
    let requests = 0;
    const server: Deno.HttpServer<Deno.NetAddr> = Deno.serve({
      hostname: '127.0.0.1',
      port: 0,
      onListen() {},
    }, (request): Response => {
      requests++;
      if (new URL(request.url).pathname.endsWith('.tgz')) return new Response(archive);
      return Response.json({
        name: 'netscript-probe-fixture',
        'dist-tags': { latest: '1.0.0' },
        time: { '1.0.0': '2000-01-01T00:00:00Z' },
        versions: {
          '1.0.0': {
            name: 'netscript-probe-fixture',
            version: '1.0.0',
            type: 'module',
            exports: './index.js',
            dist: { tarball: `http://127.0.0.1:${server.addr.port}/fixture.tgz`, integrity },
          },
        },
      });
    });
    try {
      await Deno.writeTextFile(
        join(root, '.npmrc'),
        `registry=http://127.0.0.1:${server.addr.port}/\n`,
      );
      await Deno.writeTextFile(
        join(root, 'deno.json'),
        JSON.stringify({
          imports: { fixture: 'npm:netscript-probe-fixture@^1.0.0' },
          minimumDependencyAge: 'P1D',
        }),
      );
      await Deno.writeTextFile(join(root, 'prepare.ts'), "import 'fixture';\n");
      const prepared = await new DenoProcess().exec(Deno.execPath(), [
        'cache',
        '--config',
        join(root, 'deno.json'),
        '--lock',
        join(root, 'deno.lock'),
        '--node-modules-dir=none',
        join(root, 'prepare.ts'),
      ], { cwd: root, env: { DENO_DIR: cacheA }, timeoutMs: 10_000, maxOutputBytes: 65_536 });
      assertEquals(prepared.code, 0, prepared.stderr);
      const files = await snapshot(cacheA);
      assert(Object.values(files).reduce((sum, value) => sum + value.bytes, 0) < 10 * 1024 * 1024);
      const exact = Object.keys(files).filter((path) =>
        path.replaceAll('\\', '/').includes('/netscript-probe-fixture/1.0.0/')
      );
      assert(exact.length > 0, 'canonical Deno package version files must exist');
      for (const path of exact) {
        const destination = join(cacheB, path);
        await Deno.mkdir(dirname(destination), { recursive: true });
        await Deno.copyFile(join(cacheA, path), destination);
      }
      const onlyExact = await snapshot(cacheB);
      assertEquals(Object.keys(onlyExact).length, exact.length);
      assertEquals(Object.keys(onlyExact).some((path) => path.endsWith('registry.json')), false);
    } finally {
      await server.shutdown();
    }
    const requestsAfterPreparation = requests;
    await Deno.mkdir(join(root, 'node_modules'));
    await Deno.writeTextFile(join(root, 'node_modules/sentinel'), 'consumer-owned\n');
    const native = new DenoProcess();
    const offline: ProcessPort = {
      exec(command, args, options) {
        return native.exec(command, [...args.slice(0, 1), '--cached-only', ...args.slice(1)], {
          ...options,
          env: { ...options?.env, DENO_DIR: cacheB },
        });
      },
    };
    const before = await snapshot(root);
    const red = await offline.exec(Deno.execPath(), [
      'run',
      '--no-check',
      '--no-lock',
      '--allow-read',
      '--allow-env',
      '--allow-net',
      '--deny-write',
      '--deny-run',
      '--no-prompt',
      '--minimum-dependency-age=0',
      '--config',
      join(root, 'deno.json'),
      CHILD,
      'fixture',
    ], { cwd: root, timeoutMs: 3_000, maxOutputBytes: 65_536 });
    assertEquals(red.code, 71);
    assertStringIncludes(red.stdout, 'npm package not found in cache');
    assertStringIncludes(red.stdout, '--cached-only');
    const result = await probeConfiguredPluginManifest(root, 'fixture', offline, {
      denoCommand: Deno.execPath(),
    });
    assertEquals(result.status, 'resolved', JSON.stringify(result));
    if (result.status === 'resolved') assertEquals(result.manifest.version, '1.0.0');
    assertEquals(requests, requestsAfterPreparation);
    assertEquals(await snapshot(root), before);
    const afterCache = await snapshot(cacheB);
    assertEquals(Object.keys(afterCache).some((path) => path.endsWith('registry.json')), false);
    assert(
      Object.values(await snapshot(dirname(root))).reduce((sum, value) => sum + value.bytes, 0) <
        10 * 1024 * 1024,
    );
    assert(Date.now() - started < 30_000, 'bounded synthetic registry control');
  });
});

async function withProject(run: (root: string) => Promise<void>): Promise<void> {
  const fixture = await Deno.makeTempDir({ prefix: 'netscript-probe-test-' });
  const root = join(fixture, 'project');
  try {
    await Deno.mkdir(root);
    await Deno.writeTextFile(join(root, 'deno.json'), '{}\n');
    await Deno.writeTextFile(join(root, 'plugin.ts'), SOURCE);
    await run(root);
  } finally {
    await Deno.remove(fixture, { recursive: true });
  }
}

async function prepareLock(root: string, lock = 'deno.lock'): Promise<void> {
  const server = Deno.serve(
    { hostname: '127.0.0.1', port: 0, onListen() {} },
    () => new Response('export {};\n', { headers: { 'content-type': 'application/javascript' } }),
  );
  try {
    const result = await new DenoProcess().exec(Deno.execPath(), [
      'cache',
      '--config',
      join(root, 'deno.json'),
      '--lock',
      join(root, lock),
      `http://127.0.0.1:${server.addr.port}/fixture.js`,
    ], { cwd: root, timeoutMs: 3_000, maxOutputBytes: 65_536 });
    assertEquals(result.code, 0, result.stderr);
    await Deno.stat(join(root, lock));
  } finally {
    await server.shutdown();
  }
}

function probe(root: string, cachedOnly = false): Promise<ConfiguredPluginManifestProbeResult> {
  const native = new DenoProcess();
  const process: ProcessPort = {
    exec(command, args, options) {
      return native.exec(
        command,
        cachedOnly ? [args[0], '--cached-only', ...args.slice(1)] : args,
        options,
      );
    },
  };
  return probeConfiguredPluginManifest(root, './plugin.ts', process, {
    denoCommand: Deno.execPath(),
  });
}

async function snapshot(root: string): Promise<Record<string, { bytes: number; sha256: string }>> {
  const files: Record<string, { bytes: number; sha256: string }> = {};
  async function walk(directory: string): Promise<void> {
    for await (const entry of Deno.readDir(directory)) {
      assertEquals(entry.isSymlink, false, entry.name);
      const path = join(directory, entry.name);
      if (entry.isDirectory) await walk(path);
      else {
        const bytes = await Deno.readFile(path);
        files[relative(root, path)] = {
          bytes: bytes.length,
          sha256: new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)).toHex(),
        };
      }
    }
  }
  await walk(root);
  return files;
}

async function npmArchive(): Promise<Uint8Array<ArrayBuffer>> {
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  for (
    const [name, source] of Object.entries({
      'package/package.json': JSON.stringify({
        name: 'netscript-probe-fixture',
        version: '1.0.0',
        type: 'module',
        exports: './index.js',
      }),
      'package/index.js': SOURCE,
    })
  ) {
    const content = encoder.encode(source);
    const header = new Uint8Array(512);
    const field = (offset: number, length: number, text: string): void => {
      header.set(encoder.encode(text).slice(0, length), offset);
    };
    field(0, 100, name);
    field(100, 8, '0000644\0');
    field(108, 8, '0000000\0');
    field(116, 8, '0000000\0');
    field(124, 12, content.length.toString(8).padStart(11, '0') + '\0');
    field(136, 12, '00000000000\0');
    header.fill(32, 148, 156);
    header[156] = 48;
    field(257, 6, 'ustar\0');
    field(263, 2, '00');
    field(148, 8, header.reduce((sum, byte) => sum + byte, 0).toString(8).padStart(6, '0') + '\0 ');
    chunks.push(header, content, new Uint8Array((512 - content.length % 512) % 512));
  }
  chunks.push(new Uint8Array(1024));
  const stream = new Blob(chunks).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
