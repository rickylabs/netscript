import { assertEquals } from '@std/assert';
import { join, relative } from '@std/path';
import * as windows from '@std/path/windows';
import {
  type ConfiguredPluginManifestProbeResult,
  probeConfiguredPluginManifest,
} from '../../config/plugin-manifest/configured-plugin-manifest-probe.ts';
import { DenoProcess } from './deno-process.ts';
import { readConsumerInspectionLock } from './frozen-plugin-inspection.ts';

Deno.test('consumer lock selection honors string and object paths without writing the project', async () => {
  for (
    const { lock, path } of [
      { lock: 'locks/consumer.lock', path: 'locks/consumer.lock' },
      { lock: { path: 'locks/consumer.lock' }, path: 'locks/consumer.lock' },
      { lock: '../consumer.lock', path: '../consumer.lock' },
      { lock: true, path: 'deno.lock' },
      { lock: {}, path: 'deno.lock' },
    ]
  ) {
    await withProject(async (root) => {
      await Deno.mkdir(join(root, 'locks'));
      await Deno.writeTextFile(join(root, 'deno.json'), JSON.stringify({ lock }));
      await prepareLock(root, path);
      const before = await snapshot(root);
      const lockBytes = await Deno.readFile(join(root, path));
      assertEquals(
        await readConsumerInspectionLock(root),
        lockBytes,
      );
      assertEquals((await probe(root)).status, 'resolved');
      assertEquals(await Deno.readFile(join(root, path)), lockBytes);
      assertEquals(await snapshot(root), before);
    });
  }
});

Deno.test('consumer lock on another Windows volume keeps absolute authority and real owned bytes', async () => {
  const selected = windows.resolve('C:/root', 'D:/consumer.lock');
  const rel = windows.relative('C:/root', selected);
  assertEquals(windows.isAbsolute(rel), true);
  assertEquals(
    windows.join(
      windows.parse(selected).root,
      windows.relative(windows.parse(selected).root, selected),
    ),
    selected,
  );
  // Real Windows helper/reader control; other platforms retain the pure Windows mapping assertions.
  if (Deno.build.os !== 'windows') return;
  await withProject(async (root) => {
    await prepareLock(root);
    const expected = await Deno.readFile(join(root, 'deno.lock'));
    await Deno.writeTextFile(join(root, 'deno.json'), JSON.stringify({ lock: 'D:/consumer.lock' }));
    const open = Deno.open;
    const lstat = Deno.lstat;
    const remap = (path: string | URL): string | URL =>
      path === selected ? join(root, 'deno.lock') : path;
    try {
      Deno.open = (path, options) => open(remap(path), options);
      Deno.lstat = (path) => lstat(remap(path));
      assertEquals(await readConsumerInspectionLock(root), expected);
    } finally {
      Deno.open = open;
      Deno.lstat = lstat;
    }
    assertEquals(await Deno.readFile(join(root, 'deno.lock')), expected);
  });
});

async function withProject(run: (root: string) => Promise<void>): Promise<void> {
  const fixture = await Deno.makeTempDir({ prefix: 'netscript-lock-reader-test-' });
  const root = join(fixture, 'project');
  try {
    await Deno.mkdir(root);
    await Deno.writeTextFile(join(root, 'deno.json'), '{}\n');
    await Deno.writeTextFile(
      join(root, 'plugin.ts'),
      "export default { name: '@fixture/probe', version: '1.0.0', contributions: {} };\n",
    );
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

function probe(root: string): Promise<ConfiguredPluginManifestProbeResult> {
  return probeConfiguredPluginManifest(root, './plugin.ts', new DenoProcess(), {
    denoCommand: Deno.execPath(),
  });
}

async function snapshot(root: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  async function walk(directory: string): Promise<void> {
    for await (const entry of Deno.readDir(directory)) {
      assertEquals(entry.isSymlink, false, entry.name);
      const path = join(directory, entry.name);
      if (entry.isDirectory) await walk(path);
      else {files[relative(root, path)] = new Uint8Array(
          await crypto.subtle.digest('SHA-256', await Deno.readFile(path)),
        ).toHex();}
    }
  }
  await walk(root);
  return files;
}
