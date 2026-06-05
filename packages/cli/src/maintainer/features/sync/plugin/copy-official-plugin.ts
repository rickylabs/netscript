/**
 * @module maintainer/features/sync/plugin/copy-official-plugin
 *
 * Copies first-party NetScript plugin implementations from a monorepo checkout
 * into a scaffolded project.
 */

import { basename, join } from '@std/path';

import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import {
  assertOfficialSourceRoot,
  canCopyOfficialPlugin,
  type CopyOfficialPluginOptions,
  findOfficialPluginSourceRoot,
  getOfficialPluginSource,
  type OfficialPluginCopyResult,
  type OfficialPluginDependency,
  type OfficialPluginSource,
  type PluginSourceMode,
} from '../../../adapters/official-plugin-source.ts';
import {
  copyPluginDirectory,
  copyWorkspaceDirectory,
  ensureBackgroundRuntimeDirs,
  pruneNonPortableBackgroundSamples,
  readPluginScaffoldRuntimeManifest,
  regenerateCopiedRuntimeRegistries,
  removeCopiedFiles,
} from '../../../adapters/plugin-file-collector.ts';
import {
  rewriteCopiedDenoJsons,
  rewritePackagePathToJsr,
  toJsrSubpath,
} from '../../../adapters/plugin-import-rewriter.ts';

export { canCopyOfficialPlugin, findOfficialPluginSourceRoot, getOfficialPluginSource };

export type {
  CopyOfficialPluginOptions,
  OfficialPluginCopyResult,
  OfficialPluginDependency,
  OfficialPluginSource,
  PluginSourceMode,
};

/** Copy a first-party plugin implementation into a scaffolded project. */
export async function copyOfficialPlugin(
  options: CopyOfficialPluginOptions,
): Promise<OfficialPluginCopyResult> {
  const source = await getOfficialPluginSource(options.sourceRoot, options.kind);
  if (source.canonicalName !== options.pluginName) {
    throw new ScaffoldValidationError(
      `Official ${options.kind} plugin source must use canonical name "${source.canonicalName}".`,
      {
        kind: options.kind,
        requestedName: options.pluginName,
        canonicalName: source.canonicalName,
      },
    );
  }

  await assertOfficialSourceRoot(options.sourceRoot);

  const directoriesCreated: string[] = [];
  const filesCreated: string[] = [];
  const filesSkipped: string[] = [];
  const workspaceMembers: string[] = [];

  for (const dependency of source.dependencies) {
    const result = await copyPluginDirectory(
      options.sourceRoot,
      options.targetPath,
      dependency.pluginDir,
      options.force,
    );
    directoriesCreated.push(...result.directoriesCreated);
    filesCreated.push(...result.filesCreated);
    filesSkipped.push(...result.filesSkipped);

    await rewritePluginDenoJsons(options, dependency.pluginDir);
  }

  const pluginCopy = await copyPluginDirectory(
    options.sourceRoot,
    options.targetPath,
    source.pluginDir,
    options.force,
  );
  directoriesCreated.push(...pluginCopy.directoriesCreated);
  filesCreated.push(...pluginCopy.filesCreated);
  filesSkipped.push(...pluginCopy.filesSkipped);

  await rewritePluginDenoJsons(options, source.pluginDir);

  let backgroundDir: string | null = null;
  if (source.backgroundDir) {
    const scaffoldManifest = await readPluginScaffoldRuntimeManifest(
      options.sourceRoot,
      source.pluginDir,
    );
    const backgroundSourceDir = await resolveBackgroundSourceDir(
      options.sourceRoot,
      source.backgroundDir,
    );
    const backgroundCopy = await copyWorkspaceDirectory(
      options.sourceRoot,
      options.targetPath,
      source.backgroundDir,
      options.force,
      backgroundSourceDir,
    );
    directoriesCreated.push(...backgroundCopy.directoriesCreated);
    filesCreated.push(...backgroundCopy.filesCreated);
    filesSkipped.push(...backgroundCopy.filesSkipped);

    backgroundDir = join(options.targetPath, source.backgroundDir);
    const removedFiles = await pruneNonPortableBackgroundSamples({
      workspaceDir: backgroundDir,
      workspaceName: source.backgroundDir,
      includeSamples: options.includeSamples ?? true,
      manifest: scaffoldManifest,
    });
    removeCopiedFiles(filesCreated, removedFiles);
    filesSkipped.push(...removedFiles);
    workspaceMembers.push(source.backgroundDir);

    await rewriteCopiedDenoJsons({
      root: backgroundDir,
      projectName: options.projectName,
      importMode: options.importMode,
      workspacePackageName: `@${options.projectName}/${source.backgroundDir}`,
    });
    directoriesCreated.push(
      ...await ensureBackgroundRuntimeDirs(
        options.targetPath,
        source.backgroundDir,
        scaffoldManifest,
      ),
    );
  }

  await regenerateCopiedRuntimeRegistries(options.targetPath, {
    includeSamples: options.includeSamples ?? true,
  });

  return {
    scaffoldResult: {
      filesCreated,
      directoriesCreated,
      filesSkipped,
      totalOperations: filesCreated.length + directoriesCreated.length,
      durationMs: 0,
    },
    pluginName: source.canonicalName,
    pluginDir: join(options.targetPath, SCAFFOLD_DIRS.PLUGINS, source.pluginDir),
    backgroundDir,
    serviceConfigKey: source.serviceConfigKey,
    servicePort: source.servicePort,
    serviceEntrypoint: source.serviceEntrypoint,
    backgroundPort: source.backgroundPort,
    backgroundEntrypoint: source.backgroundEntrypoint ?? null,
    dependencies: source.dependencies,
    pluginReferences: source.pluginReferences ?? [],
    workspaceMembers,
  };
}

async function resolveBackgroundSourceDir(
  sourceRoot: string,
  backgroundDir: string,
): Promise<string> {
  try {
    await Deno.stat(join(sourceRoot, backgroundDir));
    return backgroundDir;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }

  const pluginRelativeDir = join(SCAFFOLD_DIRS.PLUGINS, backgroundDir);
  try {
    await Deno.stat(join(sourceRoot, pluginRelativeDir));
    return pluginRelativeDir;
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }

  return backgroundDir;
}

function rewritePluginDenoJsons(
  options: CopyOfficialPluginOptions,
  pluginDir: string,
): Promise<void> {
  return rewriteCopiedDenoJsons({
    root: join(options.targetPath, SCAFFOLD_DIRS.PLUGINS, pluginDir),
    projectName: options.projectName,
    importMode: options.importMode,
    workspacePackageName: null,
  });
}

export const _internal = {
  rewritePackagePathToJsr,
  toJsrSubpath,
  basename,
};
