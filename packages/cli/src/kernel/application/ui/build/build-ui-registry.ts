import { dirname, isAbsolute, join, relative, resolve } from '@std/path';
import type { FileSystemPort } from '../../../ports/file-system-port.ts';
import type { UiRegistryPathPort } from '../../../ports/ui-registry-port.ts';

/** Build a publisher's static registry without writing anything until every source validates. */
export async function buildUiRegistry(input: {
  readonly registry: string;
  readonly sourceRoot?: string;
  readonly output: string;
}, dependencies: {
  readonly fs: FileSystemPort;
  readonly paths: UiRegistryPathPort;
}): Promise<readonly string[]> {
  const { buildRegistry } = await import('@netscript/fresh-ui/registry-v2');
  const sourceRoot = resolve(input.sourceRoot ?? dirname(input.registry));
  await dependencies.paths.assertContained(sourceRoot, input.registry);
  const artifacts = await buildRegistry({
    registry: JSON.parse(await dependencies.fs.readFile(input.registry)),
    readSource: async (path) => {
      const target = resolve(sourceRoot, path);
      const inside = relative(sourceRoot, target);
      if (isAbsolute(inside) || inside.startsWith('..')) {
        throw new Error('Registry source escapes root');
      }
      await dependencies.paths.assertContained(sourceRoot, target);
      return await dependencies.fs.readFile(target);
    },
  });
  const output = resolve(input.output);
  for (const name of Object.keys(artifacts)) {
    await dependencies.paths.assertContained(output, join(output, name));
  }
  for (const [name, bytes] of Object.entries(artifacts)) {
    await dependencies.fs.writeFile(join(output, name), bytes);
  }
  return Object.keys(artifacts).map((name) => join(output, name));
}
