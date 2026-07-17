import { assertEquals, assertThrows } from '@std/assert';
import { createReleaseClientForTarget } from '../../src/auto-update/application/release-client.ts';
import type { AutoUpdateReleaseConfig } from '../../src/auto-update/domain/types.ts';

const VALID_CONFIG: AutoUpdateReleaseConfig = {
  baseUrl: 'https://releases.example.com/my-app',
  publicKey: 'base64-ed25519-public-key',
  manualUpdateUrl: 'https://example.com/downloads/my-app',
};

Deno.test('release URL uses the literal linux-x86_64 Deno target vocabulary', () => {
  const client = createReleaseClientForTarget(VALID_CONFIG, {
    os: 'linux',
    arch: 'x86_64',
  });

  assertEquals(
    client.updateUrl,
    'https://releases.example.com/my-app/stable/linux-x86_64',
  );
  assertEquals(client.channel, 'stable');
  assertEquals(client.publicKey, VALID_CONFIG.publicKey);
});

Deno.test('release URL uses the literal darwin-aarch64 Deno target vocabulary', () => {
  const client = createReleaseClientForTarget({
    ...VALID_CONFIG,
    baseUrl: 'https://releases.example.com/my-app/',
    channel: 'beta ring',
  }, {
    os: 'darwin',
    arch: 'aarch64',
  });

  assertEquals(
    client.updateUrl,
    'https://releases.example.com/my-app/beta%20ring/darwin-aarch64',
  );
  assertEquals(client.channel, 'beta ring');
});

Deno.test('release client rejects untrusted or incomplete app configuration', () => {
  assertThrows(
    () =>
      createReleaseClientForTarget({ ...VALID_CONFIG, baseUrl: 'http://example.com' }, {
        os: 'windows',
        arch: 'x86_64',
      }),
    TypeError,
    'baseUrl must use HTTPS',
  );
  assertThrows(
    () =>
      createReleaseClientForTarget({ ...VALID_CONFIG, manualUpdateUrl: 'file:///setup.exe' }, {
        os: 'windows',
        arch: 'x86_64',
      }),
    TypeError,
    'manualUpdateUrl must use HTTPS',
  );
  assertThrows(
    () =>
      createReleaseClientForTarget({ ...VALID_CONFIG, publicKey: '  ' }, {
        os: 'linux',
        arch: 'aarch64',
      }),
    TypeError,
    'publicKey must not be empty',
  );
  assertThrows(
    () =>
      createReleaseClientForTarget({ ...VALID_CONFIG, channel: '  ' }, {
        os: 'linux',
        arch: 'aarch64',
      }),
    TypeError,
    'channel must not be empty',
  );
});

Deno.test('Deno global access is isolated to the structural adapter', async () => {
  const sourceRoot = new URL('../../src/auto-update/', import.meta.url);
  const adapterPath = 'adapters/deno-auto-update-adapter.ts';
  const forbidden = /\bglobalThis\b|\bDeno\.(?:build|desktop|autoUpdate|desktopVersion)\b/;
  const violations: string[] = [];

  async function visit(directory: URL, relativeDirectory = ''): Promise<void> {
    for await (const entry of Deno.readDir(directory)) {
      const relativePath = `${relativeDirectory}${entry.name}`;
      const url = new URL(entry.name, directory);
      if (entry.isDirectory) {
        await visit(new URL(`${entry.name}/`, directory), `${relativePath}/`);
      } else if (entry.isFile && entry.name.endsWith('.ts') && relativePath !== adapterPath) {
        const source = await Deno.readTextFile(url);
        const executableSource = source
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/.*$/gm, '');
        if (forbidden.test(executableSource)) {
          violations.push(relativePath);
        }
      }
    }
  }

  await visit(sourceRoot);
  assertEquals(violations, []);
});
