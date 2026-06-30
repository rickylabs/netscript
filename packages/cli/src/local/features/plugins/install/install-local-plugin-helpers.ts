import { dirname, join, relative, resolve } from '@std/path';
import type { InstallLocalPluginDependencies } from './install-local-plugin.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import type { ScaffolderPort } from '../../../../kernel/ports/template-port.ts';
import { generatePluginServiceContext } from '../../../../kernel/templates/plugins/plugin-generators.ts';
import { findOfficialPluginSourceRoot } from '../../../../maintainer/maintainer-api.ts';

/** Merge explicit references with default dependency references. */
export function mergeUniqueReferences(
  explicitReferences: readonly string[],
  defaultReferences: readonly string[],
): readonly string[] {
  return [...new Set([...explicitReferences, ...defaultReferences])];
}

/** Convert an absolute path to a workspace-relative path for generated config. */
export function toWorkspaceRelativePath(projectRoot: string, path: string): string {
  return relative(projectRoot, path).replaceAll('\\', '/');
}

/** Detect whether an official plugin owns its background entrypoint inside the plugin workspace. */
export function usesPluginOwnedBackgroundEntrypoint(
  result: { readonly backgroundEntrypoint: string | null },
): boolean {
  return result.backgroundEntrypoint?.replace(/\\/g, '/').startsWith('src/') ?? false;
}

/** Ensure the shared plugin service context helper exists in generated projects. */
export async function ensurePluginServiceContext(
  projectRoot: string,
  scaffolder: ScaffolderPort,
  overwrite: boolean,
): Promise<boolean> {
  const sharedDir = join(projectRoot, SCAFFOLD_DIRS.SERVICES, '_shared');
  await scaffolder.createDir(sharedDir);
  return await scaffolder.writeFile(
    join(sharedDir, 'plugin-service-context.ts'),
    generatePluginServiceContext(),
    overwrite,
  );
}

/** Find the contributor checkout without selecting the generated project itself. */
export async function resolveOfficialPluginSourceRoot(
  projectRoot: string,
  dependencies: InstallLocalPluginDependencies,
): Promise<string | null> {
  const findSourceRoot = dependencies.findSourceRoot ?? findOfficialPluginSourceRoot;
  const normalizedProjectRoot = normalizePath(projectRoot);
  let startDir = normalizePath(dependencies.sourceRootStartDir ?? projectRoot);

  while (true) {
    const sourceRoot = await findSourceRoot(startDir);
    if (!sourceRoot) {
      return null;
    }

    if (!isWithinPath(normalizedProjectRoot, sourceRoot)) {
      return sourceRoot;
    }

    const normalizedSourceRoot = normalizePath(sourceRoot);
    const nextStartDir = normalizePath(dirname(sourceRoot));
    if (nextStartDir === normalizedSourceRoot) {
      return null;
    }
    startDir = nextStartDir;
  }
}

function normalizePath(path: string): string {
  return resolve(path).toLowerCase();
}

function isWithinPath(root: string, candidate: string): boolean {
  const relativePath = relative(root, normalizePath(candidate));
  return relativePath === '' ||
    (!relativePath.startsWith('..') &&
      relativePath !== '.' &&
      !relativePath.includes(':'));
}
