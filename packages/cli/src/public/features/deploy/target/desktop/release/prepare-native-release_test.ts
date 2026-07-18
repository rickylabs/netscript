import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import type { PromoteReleaseRequest } from './release-store.ts';
import { NativeReleaseError } from './native-release-contract.ts';
import { prepareNativeRelease } from './prepare-native-release.ts';

Deno.test('release preparation composes lowercase digests and exact native patch map', async () => {
  let promoted: PromoteReleaseRequest | undefined;
  const result = await prepareNativeRelease(
    {
      route: { channel: 'stable', os: 'linux', arch: 'x86_64' },
      version: '2.0.0',
      sequence: 42,
      currentRuntimePath: '/runtime/new.so',
      previousRuntimes: [
        { version: '1.0.0', runtimePath: '/runtime/one.so' },
        { version: '1.5.0', runtimePath: '/runtime/one-five.so' },
      ],
    },
    {
      createPatch: (oldPath) => Promise.resolve(new TextEncoder().encode(oldPath)),
      sign: (signed) => Promise.resolve({ signed, signature: 'fixture' }),
      promote: (request) => {
        promoted = request;
        return Promise.resolve({ routeDirectory: '/release/stable/linux-x86_64', manifestPath: '/release/stable/linux-x86_64/latest.json' });
      },
    },
  );

  assertEquals(result.payload.manifestVersion, 1);
  assertEquals(result.payload.sequence, 42);
  assertEquals(Object.keys(result.payload.patches), ['1.0.0', '1.5.0']);
  for (const patch of Object.values(result.payload.patches)) {
    assertEquals(/^[0-9a-f]{64}$/.test(patch.sha256), true);
    assertStringIncludes(patch.name, '-to-2.0.0-');
  }
  assertEquals(promoted?.sequence, 42);
  assertEquals(promoted?.artifacts.length, 2);
  assertEquals(result.envelope.signed, JSON.stringify(result.payload));
});

Deno.test('release preparation rejects duplicate and unsafe prior versions before promotion', async () => {
  const error = await assertRejects(
    () => prepareNativeRelease(
      {
        route: { channel: 'stable', os: 'linux', arch: 'x86_64' },
        version: '2.0.0',
        sequence: 1,
        currentRuntimePath: '/new',
        previousRuntimes: [
          { version: '1.0.0', runtimePath: '/one' },
          { version: '1.0.0', runtimePath: '/two' },
        ],
      },
      {
        createPatch: () => Promise.resolve(new Uint8Array([1])),
        sign: (signed) => Promise.resolve({ signed, signature: '' }),
        promote: () => Promise.reject(new Error('must not promote')),
      },
    ),
    NativeReleaseError,
  );
  assertEquals(error.code, 'invalid-input');
});
