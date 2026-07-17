import { assert, assertEquals, assertMatch, assertThrows } from '@std/assert';
import { buildBundleJs } from './bundle.ts';
import { ConversionError, convertUnits } from './convert.ts';
import type { RegistryUnit, SyncConfig } from './types.ts';

const CONFIG: SyncConfig = {
  projectId: 'test-project',
  projectName: 'Test project',
  pkg: '@netscript/test-design-sync',
  globalName: 'TestDesignSync',
  shape: 'package',
  registry: { root: 'packages/fresh-ui', manifest: 'registry.manifest.ts' },
  scratchDir: '.llm/tmp/design-sync-test',
  fontImport: '',
  exclude: [],
  subpaths: {},
  groups: { island: 'islands' },
  react: { version: '19.2.0', domVersion: '19.2.0' },
  repoRoot: '/tmp/design-sync-test',
  configPath: '/tmp/design-sync-test/config.json',
};

function registryUnit(name: string, pkgPath: string, content: string): RegistryUnit {
  return {
    item: {
      name,
      kind: 'island',
      description: 'Converter test fixture.',
      copyOwnership: 'app-owned-after-copy',
      tags: ['test'],
      files: [{ source: `registry/${pkgPath}`, target: `@${pkgPath}` }],
    },
    sources: [{ registryPath: `registry/${pkgPath}`, pkgPath, content }],
  };
}

Deno.test({
  name: 'converted Preact values resolve against the generated React compatibility shims',
  permissions: { read: true, run: true, write: true },
}, async () => {
  const unit = registryUnit(
    'value-island',
    'islands/ValueIsland.tsx',
    `import { createContext, h } from 'preact';
import { useCallback, useContext, useEffect, useId, useRef, useState } from 'preact/hooks';
import { useSignal } from '@preact/signals';

const Context = createContext('ready');

export function ValueIsland() {
  const signal = useSignal(0);
  const context = useContext(Context);
  const id = useId();
  const ref = useRef(null);
  const [state] = useState(context);
  const callback = useCallback(() => signal.value, [signal]);
  useEffect(callback, [callback]);
  return h('div', { id, ref }, state);
}
`,
  );

  const output = convertUnits(CONFIG, [unit]);
  const converted = output.pkgFiles.get('islands/ValueIsland.tsx');
  const preactCompat = output.pkgFiles.get('__ds/preact-compat.ts');
  const hooksCompat = output.pkgFiles.get('__ds/hooks.ts');
  const signalsCompat = output.pkgFiles.get('__ds/signals.ts');

  assert(converted);
  assert(preactCompat);
  assert(hooksCompat);
  assert(signalsCompat);
  assertMatch(converted, /from '\.\.\/__ds\/preact-compat\.ts'/);
  assertMatch(converted, /from '\.\.\/__ds\/hooks\.ts'/);
  assertMatch(converted, /from '\.\.\/__ds\/signals\.ts'/);
  assertMatch(preactCompat, /export const h = React\.createElement;/);
  assertMatch(preactCompat, /export const createContext = React\.createContext;/);
  for (
    const hook of ['useCallback', 'useContext', 'useEffect', 'useId', 'useRef', 'useState']
  ) {
    assertMatch(hooksCompat, new RegExp(`export const ${hook} = React\\.${hook};`));
  }
  assertMatch(signalsCompat, /export function useSignal<T>/);
  assertEquals(output.conversions[0].errors, []);

  const bundleConfig: SyncConfig = {
    ...CONFIG,
    repoRoot: Deno.cwd(),
    scratchDir: `.llm/tmp/design-sync-convert-test-${crypto.randomUUID()}`,
  };
  const scratchRoot = `${bundleConfig.repoRoot}/${bundleConfig.scratchDir}`;
  try {
    const bundle = await buildBundleJs(bundleConfig, output.pkgFiles, output.conversions);
    assert(bundle.bundleJs.length > 0);
  } finally {
    await Deno.remove(scratchRoot, { recursive: true }).catch(() => undefined);
  }
});

Deno.test('unmapped Preact values fail conversion with unit, file, and symbol', () => {
  const unit = registryUnit(
    'future-island',
    'islands/FutureIsland.tsx',
    `import { futureValue } from 'preact';

export function FutureIsland() {
  return futureValue('div');
}
`,
  );

  const error = assertThrows(() => convertUnits(CONFIG, [unit]), ConversionError);
  assertMatch(error.message, /^conversion errors:/);
  assertMatch(
    error.message,
    /future-island: unmapped preact value import "futureValue" in islands\/FutureIsland\.tsx/,
  );
});
