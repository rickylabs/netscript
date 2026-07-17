import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import { NativeReleaseError } from './native-release-contract.ts';
import { DenoNativeReleaseStore, type PromoteReleaseRequest } from './release-store.ts';

function request(sequence: number): PromoteReleaseRequest {
  return {
    route: { channel: 'stable', os: 'linux', arch: 'x86_64' },
    sequence,
    artifacts: [{ name: '1-to-2-deadbeef.bsdiff', bytes: new Uint8Array([1, 2, 3]) }],
    envelope: { signed: JSON.stringify({ sequence }), signature: `signature-${sequence}` },
  };
}

Deno.test('release store rejects lower and equal sequences using private high-water', async () => {
  const root = await Deno.makeTempDir();
  try {
    const store = new DenoNativeReleaseStore(root);
    await store.promote(request(5));
    for (const sequence of [5, 4]) {
      const error = await assertRejects(() => store.promote(request(sequence)), NativeReleaseError);
      assertEquals(error.code, 'sequence-rejected');
    }
    assertEquals(
      await Deno.readTextFile(join(root, 'stable', 'linux-x86_64', '.release-state', 'high-water')),
      '5\n',
    );
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('concurrent promotion permits exactly one route winner', async () => {
  const root = await Deno.makeTempDir();
  try {
    const store = new DenoNativeReleaseStore(root);
    const results = await Promise.allSettled([store.promote(request(8)), store.promote(request(9))]);
    assertEquals(results.filter((result) => result.status === 'fulfilled').length, 1);
    assertEquals(results.filter((result) => result.status === 'rejected').length, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('manifest replacement failure safely burns sequence after immutable patch write', async () => {
  const root = await Deno.makeTempDir();
  const route = join(root, 'stable', 'linux-x86_64');
  try {
    await Deno.mkdir(join(route, 'latest.json'), { recursive: true });
    const store = new DenoNativeReleaseStore(root);
    const failure = await assertRejects(() => store.promote(request(12)), NativeReleaseError);
    assertEquals(failure.code, 'store-failed');
    assertEquals(await Deno.readTextFile(join(route, '.release-state', 'high-water')), '12\n');
    assertEquals(await Deno.readFile(join(route, '1-to-2-deadbeef.bsdiff')), new Uint8Array([1, 2, 3]));
    const retry = await assertRejects(() => store.promote(request(12)), NativeReleaseError);
    assertEquals(retry.code, 'sequence-rejected');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('corrupt private high-water fails closed', async () => {
  const root = await Deno.makeTempDir();
  try {
    const state = join(root, 'stable', 'linux-x86_64', '.release-state');
    await Deno.mkdir(state, { recursive: true });
    await Deno.writeTextFile(join(state, 'high-water'), '12-corrupt\n');
    const error = await assertRejects(
      () => new DenoNativeReleaseStore(root).promote(request(13)),
      NativeReleaseError,
    );
    assertEquals(error.code, 'store-failed');
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
