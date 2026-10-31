import { assertEquals, assertRejects } from '@std/assert';
import { join } from '@std/path';
import { renderRuntimeRegistryPlan } from './plugin-registry-renderer.ts';
import { readRuntimeManifest } from './runtime-registry-manifests.ts';

Deno.test('protocol 2 accepts legacy entries and validates optional excluded source evidence', async () => {
  const root = await Deno.makeTempDir({ prefix: 'registry-exclusion-protocol-' });
  try {
    await Deno.mkdir(join(root, 'custom'));
    await Deno.writeTextFile(join(root, 'custom/valid.ts'), 'export const valid = {};');
    await Deno.writeTextFile(join(root, 'custom/helper.ts'), '// @netscript-registry-ignore\n');
    const registryPath = '.netscript/generated/plugin-custom/registry.ts';
    const raw = {
      runtimeRegistryGenerator: { command: 'generate.ts', inspectionProtocol: 2 },
      runtimeRegistries: [{ dir: 'custom', registryPath }],
    };
    const render = (metadata: Readonly<Record<string, unknown>>) =>
      renderRuntimeRegistryPlan(
        root,
        { name: '@acme/plugin-custom', packageName: '@acme/plugin-custom', version: '1.0.0' },
        { generatorBase: root, value: raw },
        readRuntimeManifest(raw, '@acme/plugin-custom'),
        {
          exec: () =>
            Promise.resolve({
              code: 0,
              stderr: '',
              stdout: JSON.stringify({
                inspectionProtocol: 2,
                registries: [{
                  registryPath,
                  sourceFiles: ['custom/valid.ts'],
                  content: 'export const registry = new Map();\n',
                  ...metadata,
                }],
              }),
            }),
        },
      );
    assertEquals((await render({}))[0].excludedSourceFiles, undefined);
    assertEquals(
      (await render({ excludedSourceFiles: ['custom/helper.ts'] }))[0].excludedSourceFiles,
      [
        'custom/helper.ts',
      ],
    );
    for (
      const metadata of [
        { excludedSourceFiles: 'custom/helper.ts' },
        { excludedSourceFiles: null },
        { excludedSourceFiles: [42] },
        { excludedSourceFiles: ['../outside.ts'] },
        { excludedSourceFiles: ['custom/../outside.ts'] },
        { excludedSourceFiles: ['.netscript/generated/plugin-custom/registry.ts'] },
        { excludedSourceFiles: ['custom/missing.ts'] },
        { excludedSourceFiles: ['custom/helper.ts', 'custom/helper.ts'] },
        { excludedSourceFiles: ['custom/valid.ts'] },
        { excludedSourceFiles: new Array(4097).fill('custom/helper.ts') },
        { excludedSources: ['custom/helper.ts'] },
      ]
    ) {
      await assertRejects(() => render(metadata), Error);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
