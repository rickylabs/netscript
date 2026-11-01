import { assertEquals, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { checkRuntimeRegistryDrift } from './runtime-registry-drift.ts';

Deno.test('empty registry warning is plugin-independent and does not hide orphaned sources', async () => {
  const projectRoot = await Deno.makeTempDir({ prefix: 'empty-registry-drift-' });
  try {
    const path = '.netscript/generated/plugin-custom/registry.ts';
    const absolute = join(projectRoot, path);
    await Deno.mkdir(join(projectRoot, '.netscript/generated/plugin-custom'), { recursive: true });
    await Deno.writeTextFile(absolute, 'export const registry = new Map();\n');
    const input = {
      projectRoot,
      fs: new DenoFileSystem(),
      registries: [{ path, plugin: '@acme/plugin-custom', registrableItems: 0, sourceFiles: [] }],
    };
    const checks = await checkRuntimeRegistryDrift(input);
    assertEquals(checks[0].status, 'warning');
    assertStringIncludes(checks[0].message ?? '', 'zero definitions');
    await Deno.writeTextFile(
      absolute,
      `import item from '../../../custom/item.ts';
export const registry = new Map([[item.id, item]]);`,
    );
    assertEquals((await checkRuntimeRegistryDrift(input))[0].status, 'error');
    await Deno.remove(absolute);
    assertEquals((await checkRuntimeRegistryDrift(input))[0].status, 'error');
  } finally {
    await Deno.remove(projectRoot, { recursive: true });
  }
});
