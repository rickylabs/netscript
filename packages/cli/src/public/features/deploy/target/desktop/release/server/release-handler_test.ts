import { assertEquals } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import {
  AUTO_UPDATE_ARCHITECTURES,
  AUTO_UPDATE_OPERATING_SYSTEMS,
  createReleaseClient,
} from '@netscript/sdk/auto-update';
import {
  createReleaseRequestHandler,
  createReleaseRoutePath,
  RELEASE_ARTIFACT_CACHE_CONTROL,
  RELEASE_MANIFEST_CACHE_CONTROL,
  resolveReleaseFileUnderRoot,
} from './release-handler.ts';

async function fixture(): Promise<{ root: string; handler: ReturnType<typeof createReleaseRequestHandler> }> {
  const root = await Deno.makeTempDir();
  const route = join(root, 'stable', 'linux-x86_64');
  await Deno.mkdir(route, { recursive: true });
  await Deno.writeTextFile(join(route, 'latest.json'), '{"signed":"exact","signature":"sig"}');
  await Deno.writeFile(join(route, 'one.bsdiff'), new Uint8Array([1, 2, 3]));
  return { root, handler: createReleaseRequestHandler(root) };
}

Deno.test('release server route and real handler match public createReleaseClient URL composition', async () => {
  const client = createReleaseClient({
    baseUrl: 'https://releases.example.test/application',
    channel: 'preview',
    publicKey: 'fixture-key',
    manualUpdateUrl: 'https://downloads.example.test/application',
  });
  const basePath = '/application';
  assertEquals(
    new URL(client.updateUrl).pathname,
    `${basePath}${createReleaseRoutePath(client.channel, client.target.os, client.target.arch)}`,
  );
  assertEquals(AUTO_UPDATE_OPERATING_SYSTEMS.includes(client.target.os), true);
  assertEquals(AUTO_UPDATE_ARCHITECTURES.includes(client.target.arch), true);

  const root = await Deno.makeTempDir();
  try {
    const route = join(root, client.channel, `${client.target.os}-${client.target.arch}`);
    await Deno.mkdir(route, { recursive: true });
    await Deno.writeTextFile(join(route, 'latest.json'), '{}');
    const handler = createReleaseRequestHandler(root, { basePath });
    const response = await handler(new Request(`${client.updateUrl}/latest.json`));
    assertEquals(response.status, 200);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('handler serves exact manifest bytes and immutable patch HEAD metadata', async () => {
  const { root, handler } = await fixture();
  try {
    const manifest = await handler(new Request('https://release.test/stable/linux-x86_64/latest.json'));
    assertEquals(manifest.status, 200);
    assertEquals(await manifest.text(), '{"signed":"exact","signature":"sig"}');
    assertEquals(manifest.headers.get('cache-control'), RELEASE_MANIFEST_CACHE_CONTROL);
    assertEquals(manifest.headers.get('content-type'), 'application/json; charset=utf-8');

    const patch = await handler(new Request('https://release.test/stable/linux-x86_64/one.bsdiff', {
      method: 'HEAD',
    }));
    assertEquals(patch.status, 200);
    assertEquals(await patch.text(), '');
    assertEquals(patch.headers.get('content-length'), '3');
    assertEquals(patch.headers.get('cache-control'), RELEASE_ARTIFACT_CACHE_CONTROL);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('handler rejects methods, private paths, encoded separators, and traversal', async (t) => {
  const { root, handler } = await fixture();
  try {
    const method = await handler(new Request('https://release.test/stable/linux-x86_64/latest.json', {
      method: 'POST',
    }));
    assertEquals(method.status, 405);
    assertEquals(method.headers.get('allow'), 'GET, HEAD');

    for (const path of [
      '/stable/linux-x86_64/.release-state',
      '/stable/linux-x86_64/%2fsecret.bsdiff',
      '/stable/linux-x86_64/%2Fsecret.bsdiff',
      '/stable/linux-x86_64/%2e%2e/secret.bsdiff',
      '/stable/linux-x86_64/%2E%2E/secret.bsdiff',
      '/stable/linux-x86_64/..%2fsecret.bsdiff',
      '/stable/linux-x86_64/secret.txt',
      '/stable/not-a-target/latest.json',
    ]) {
      await t.step(path, async () => {
        const response = await handler(new Request(`https://release.test${path}`));
        assertEquals(response.status >= 400, true);
      });
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('resolve-under-root and realpath checks reject escape and symlink reads', async () => {
  assertEquals(resolveReleaseFileUnderRoot('/release', '../private', 'linux-x86_64', 'latest.json'), undefined);
  assertEquals(resolveReleaseFileUnderRoot('/release', 'stable', 'linux-x86_64', '../secret.bsdiff'), undefined);
  assertEquals(resolveReleaseFileUnderRoot('/release', 'stable', 'linux-x86_64', '%2fsecret.bsdiff'), undefined);

  const { root, handler } = await fixture();
  const outside = await Deno.makeTempFile();
  try {
    await Deno.writeTextFile(outside, 'private');
    await Deno.symlink(outside, join(root, 'stable', 'linux-x86_64', 'escape.bsdiff'));
    const response = await handler(
      new Request('https://release.test/stable/linux-x86_64/escape.bsdiff'),
    );
    assertEquals(response.status, 404);
  } finally {
    await Deno.remove(root, { recursive: true });
    await Deno.remove(outside);
  }
});
