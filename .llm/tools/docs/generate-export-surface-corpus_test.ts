import { assert, assertEquals, assertMatch } from '@std/assert';
import {
  colorInvariantChildEnv,
  createGeneratedAsset,
  type GeneratedExportSurfaceCorpus,
  normalizeDenoDocNode,
} from './generate-export-surface-corpus.ts';

const fixtureUrl = new URL(
  './fixtures/export-surfaces/fresh-interactive.deno-doc.json',
  import.meta.url,
);

Deno.test('normalizer consumes the checked-in Deno 2.9 JSON fixture', async () => {
  const document = JSON.parse(await Deno.readTextFile(fixtureUrl)) as {
    version: number;
    nodes: Record<string, unknown>;
  };
  assertEquals(document.version, 2);
  const node = Object.values(document.nodes)[0];
  const entries = normalizeDenoDocNode(node, '@netscript/fresh', './interactive');
  assertEquals(entries, [
    {
      packageName: '@netscript/fresh',
      subpath: './interactive',
      symbol: 'resolvedPromise',
      kind: 'function',
      signature: 'function resolvedPromise<T>(value: T): Promise<T>',
      jsDoc: 'Create a promise already primed as fulfilled for `usePromise()`.',
    },
    {
      packageName: '@netscript/fresh',
      subpath: './interactive',
      symbol: 'usePromise',
      kind: 'function',
      signature: 'function usePromise<T>(promise: Promise<T>): T',
      jsDoc: 'Read a promise using the Suspense throw-promise protocol.',
    },
  ]);
});

Deno.test('generated payload is deterministic and carries pinned count and hash metadata', async () => {
  const corpus: GeneratedExportSurfaceCorpus = {
    schemaVersion: 1,
    frameworkVersion: '0.0.4',
    surfaces: [{ packageName: '@netscript/fresh', subpath: './interactive' }],
    entries: [{
      packageName: '@netscript/fresh',
      subpath: './interactive',
      symbol: 'usePromise',
      kind: 'function',
      signature: 'function usePromise<T>(promise: Promise<T>): T',
      jsDoc: 'Read a promise using the Suspense throw-promise protocol.',
    }],
  };
  const first = await createGeneratedAsset(corpus);
  const second = await createGeneratedAsset(corpus);
  assertEquals(first, second);
  assertEquals(first.provenance, {
    schemaVersion: 1,
    frameworkVersion: '0.0.4',
    sha256: first.provenance.sha256,
    uncompressedBytes: 362,
    compressedBytes: first.provenance.compressedBytes,
    packageCount: 1,
    subpathCount: 1,
    symbolCount: 1,
  });
  assertMatch(first.provenance.sha256, /^[a-f0-9]{64}$/);
});

Deno.test('renderer covers real first-party interface, variable, alias, and class JSON shapes', async () => {
  const paths = await realEntries(
    'packages/config/src/paths/mod.ts',
    '@netscript/config',
    './paths',
  );
  assertMatch(
    paths.find((entry) => entry.symbol === 'ScaffoldDirs')?.signature ?? '',
    /^interface ScaffoldDirs \{/,
  );
  assertEquals(
    paths.find((entry) => entry.symbol === 'PERMISSIONS')?.signature,
    'const PERMISSIONS: PermissionGroups',
  );

  const builders = await realEntries(
    'packages/fresh/src/application/builders/mod.ts',
    '@netscript/fresh',
    './builders',
  );
  assertMatch(
    builders.find((entry) => entry.symbol === 'InferDefinePageLayerLoaderProps')?.signature ?? '',
    /^type InferDefinePageLayerLoaderProps</,
  );

  const errors = await realEntries(
    'packages/ai/src/contracts/errors.ts',
    '@netscript/ai',
    './errors-fixture',
  );
  const aiError = errors.find((entry) => entry.symbol === 'AiError');
  assert(aiError);
  assertMatch(aiError.signature, /^class AiError/);
});

async function realEntries(path: string, packageName: string, subpath: string) {
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['doc', '--json', path],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
  const document = JSON.parse(new TextDecoder().decode(output.stdout)) as {
    nodes: Record<string, unknown>;
  };
  return normalizeDenoDocNode(Object.values(document.nodes)[0], packageName, subpath);
}

Deno.test('colour-forcing variables are neutralized for nested deno children', () => {
  const previousForce = Deno.env.get('FORCE_COLOR');
  const previousCliColor = Deno.env.get('CLICOLOR_FORCE');
  try {
    Deno.env.set('FORCE_COLOR', '1');
    Deno.env.set('CLICOLOR_FORCE', '1');
    const env = colorInvariantChildEnv();
    assertEquals(env.NO_COLOR, '1');
    assertEquals(env.FORCE_COLOR, undefined);
    assertEquals(env.CLICOLOR_FORCE, undefined);
  } finally {
    if (previousForce === undefined) Deno.env.delete('FORCE_COLOR');
    else Deno.env.set('FORCE_COLOR', previousForce);
    if (previousCliColor === undefined) Deno.env.delete('CLICOLOR_FORCE');
    else Deno.env.set('CLICOLOR_FORCE', previousCliColor);
  }
});

Deno.test('nested deno doc output carries no colour escapes even when the caller forces colour', async () => {
  const entrypoint = new URL('../../../packages/sdk/mod.ts', import.meta.url).pathname;
  const runWith = async (env: Record<string, string>): Promise<string> => {
    const output = await new Deno.Command(Deno.execPath(), {
      args: ['doc', '--json', entrypoint],
      env,
      clearEnv: true,
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.success, true);
    return new TextDecoder().decode(output.stdout);
  };

  const previousForce = Deno.env.get('FORCE_COLOR');
  try {
    // Simulate a caller whose environment forces colour. The generator's child env must win.
    Deno.env.set('FORCE_COLOR', '1');
    const guarded = await runWith(colorInvariantChildEnv());
    assertEquals(guarded.includes('\\u001b'), false);

    // Control: the same child WITHOUT the guard does emit escapes, so the assertion has teeth.
    const unguarded = await runWith({ ...Deno.env.toObject() });
    assert(unguarded.includes('\\u001b'));

    // And the guarded output is identical whether or not the caller forced colour.
    Deno.env.delete('FORCE_COLOR');
    assertEquals(await runWith(colorInvariantChildEnv()), guarded);
  } finally {
    if (previousForce === undefined) Deno.env.delete('FORCE_COLOR');
    else Deno.env.set('FORCE_COLOR', previousForce);
  }
});
