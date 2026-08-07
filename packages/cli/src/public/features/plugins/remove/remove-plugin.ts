import { join } from '@std/path';

import { reconcilePluginReferences } from '../../../../kernel/adapters/plugin/plugin-reference-reconciler.ts';
import { regenerateAspireHelpers } from '../../../../kernel/adapters/service/workspace-mutator.ts';
import { formatGeneratedFiles } from '../../../../kernel/application/scaffold/support/format-generated-files.ts';
import { IoError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import type {
  PluginWorkspaceMutator,
  RemovedPluginAppsettingsEntries,
} from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import type { PluginDispatchPort, PluginDispatchResult } from '../dispatch/plugin-dispatch-port.ts';
import { planPluginRemoval, type PluginInstallState } from './plugin-removal-plan.ts';
import { captureProjectPaths, restoreProjectPaths } from './project-path-snapshot.ts';

/** Input for host-side plugin removal. */
export interface RemovePluginInput {
  /** Installed plugin config key to remove. */
  readonly pluginName: string;
  /** Optional plugin package specifier to receive the remove verb. */
  readonly packageName?: string;
  /** Project root directory. */
  readonly projectRoot: string;
  /** Skip remote plugin CLI dispatch. */
  readonly skipDispatch?: boolean;
}

/** Result from host-side plugin removal. */
export interface RemovePluginResult {
  /** Removed appsettings entries. */
  readonly removedAppsettings: RemovedPluginAppsettingsEntries;
  /** Generated directories removed. */
  readonly removedGeneratedDirs: readonly string[];
  /** Whether the plugin module declaration was removed from `netscript.config.ts`. */
  readonly removedNetScriptConfigPlugin: boolean;
  /** Whether the installed plugin directory was removed. */
  readonly removedPluginDir: boolean;
  /** Plugin-owned database schema directories removed. */
  readonly removedSchemaDirs: readonly string[];
  /** Aspire helper files regenerated after cleanup. */
  readonly helperFiles: readonly string[];
  /** Optional plugin CLI dispatch result. */
  readonly dispatchResult?: PluginDispatchResult;
}

/** Dependencies for removing a plugin from a project. */
export interface RemovePluginDependencies {
  /** Filesystem adapter for generated output cleanup. */
  readonly fs: FileSystemPort;
  /** Workspace config mutator. */
  readonly workspaceMutator: PluginWorkspaceMutator;
  /** Plugin CLI dispatch port. */
  readonly dispatchPort: PluginDispatchPort;
  /** Process runner used by the dispatch port. */
  readonly processRunner: ProcessPort;
  /** Scaffold writer used to regenerate shared wiring. */
  readonly scaffolder?: ScaffolderPort;
  /** Template renderer used to regenerate shared wiring. */
  readonly templateAdapter?: TemplatePort;
  /** Optional regeneration override for contract tests. */
  readonly regenerateHelpers?: typeof regenerateAspireHelpers;
}

/** Remove a plugin from host configuration and dispatch the plugin remove verb. */
export async function removePlugin(
  input: RemovePluginInput,
  dependencies: RemovePluginDependencies,
): Promise<RemovePluginResult> {
  const plan = await planPluginRemoval(
    input.projectRoot,
    input.pluginName,
    input.packageName,
    dependencies.fs,
  );
  const snapshots = await captureProjectPaths(plan.snapshotPaths, dependencies.fs);
  const dispatchResult = input.skipDispatch ? undefined : await dependencies.dispatchPort.dispatch({
    verb: 'remove',
    pkg: plan.packageSpecifier,
    args: [input.pluginName],
    projectRoot: input.projectRoot,
    processRunner: dependencies.processRunner,
  });

  try {
    const removedAppsettings = await dependencies.workspaceMutator.removeAppsettingsEntries(
      input.projectRoot,
      input.pluginName,
    );
    const removedNetScriptConfigPlugin = await dependencies.workspaceMutator
      .removeNetScriptConfigPlugin(input.projectRoot, input.pluginName);
    const removedGeneratedDirs = await removeExistingDirs(plan.generatedDirs, dependencies.fs);
    const removedSchemaDirs = await removeExistingDirs(plan.schemaDirs, dependencies.fs);
    const removedPluginDir = await removeExistingDir(plan.pluginDir, dependencies.fs);
    await reverseManagedRootDenoJson(input.projectRoot, plan.installState, dependencies.fs);
    if (!await hasConfiguredPlugins(input.projectRoot, dependencies.fs)) {
      await reverseManagedInstallFiles(input.projectRoot, plan.installState, dependencies.fs);
    }
    await reconcilePluginReferences(input.projectRoot, dependencies.fs);
    const helperFiles = await regenerateRemovalHelpers(input.projectRoot, dependencies);
    await pruneEmptyGeneratedParents(input.projectRoot, dependencies.fs);

    return {
      dispatchResult,
      helperFiles,
      removedAppsettings,
      removedGeneratedDirs,
      removedNetScriptConfigPlugin,
      removedPluginDir,
      removedSchemaDirs,
    };
  } catch (error) {
    try {
      await restoreProjectPaths(snapshots, dependencies.fs);
    } catch (rollbackError) {
      throw new IoError(
        1,
        `Unable to remove plugin "${input.pluginName}" and rollback failed.`,
        { cause: rollbackError, context: { removalError: error } },
      );
    }
    throw new IoError(
      1,
      `Unable to remove plugin "${input.pluginName}". Project state was rolled back.`,
      { cause: error },
    );
  }
}

async function removeExistingDirs(
  candidates: readonly string[],
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const removed: string[] = [];
  for (const path of candidates) {
    if (await removeExistingDir(path, fs)) removed.push(path);
  }
  return removed;
}

async function removeExistingDir(path: string, fs: FileSystemPort): Promise<boolean> {
  if (!await fs.exists(path)) return false;
  await fs.remove(path);
  return true;
}

async function regenerateRemovalHelpers(
  projectRoot: string,
  dependencies: RemovePluginDependencies,
): Promise<readonly string[]> {
  if (!await dependencies.fs.exists(join(projectRoot, 'aspire'))) return [];
  if (!dependencies.scaffolder || !dependencies.templateAdapter) {
    throw new Error('Removal wiring regeneration dependencies are unavailable.');
  }
  const helperFiles = await (dependencies.regenerateHelpers ?? regenerateAspireHelpers)(
    projectRoot,
    dependencies.fs,
    dependencies.scaffolder,
    dependencies.templateAdapter,
  );
  await formatGeneratedFiles(
    dependencies.processRunner,
    projectRoot,
    helperFiles,
    (path) => dependencies.fs.exists(path),
  );
  return helperFiles;
}

async function reverseManagedRootDenoJson(
  projectRoot: string,
  state: PluginInstallState | undefined,
  fs: FileSystemPort,
): Promise<void> {
  if (!state?.rootDenoJsonBefore || !state.rootDenoJsonAfter) return;
  const path = join(projectRoot, 'deno.json');
  if (!await fs.exists(path)) return;
  const before = JSON.parse(state.rootDenoJsonBefore) as DenoConfigShape;
  const after = JSON.parse(state.rootDenoJsonAfter) as DenoConfigShape;
  const current = JSON.parse(await fs.readFile(path)) as DenoConfigShape;
  const addedMembers = new Set((after.workspace ?? []).filter((member) =>
    !(before.workspace ?? []).includes(member)
  ));
  current.workspace = (current.workspace ?? []).filter((member) => !addedMembers.has(member));
  current.imports ??= {};
  for (const [key, installedValue] of Object.entries(after.imports ?? {})) {
    const priorValue = before.imports?.[key];
    if (installedValue === priorValue || current.imports[key] !== installedValue) continue;
    if (priorValue === undefined) delete current.imports[key];
    else current.imports[key] = priorValue;
  }
  await fs.writeFile(path, JSON.stringify(current, null, 2) + '\n');
}

interface DenoConfigShape {
  imports?: Record<string, string>;
  workspace?: string[];
  readonly [key: string]: unknown;
}

async function hasConfiguredPlugins(projectRoot: string, fs: FileSystemPort): Promise<boolean> {
  const path = join(projectRoot, 'netscript.config.ts');
  if (!await fs.exists(path)) return false;
  const source = await fs.readFile(path);
  const match = /plugins:\s*\[([\s\S]*?)\]/.exec(source);
  return match !== null && /['"]/.test(match[1]);
}

async function reverseManagedInstallFiles(
  projectRoot: string,
  state: PluginInstallState | undefined,
  fs: FileSystemPort,
): Promise<void> {
  const before = state?.managedFilesBefore;
  const after = state?.managedFilesAfter;
  if (!before || !after) return;
  for (const [relativePath, installedContent] of Object.entries(after)) {
    const path = join(projectRoot, relativePath);
    const exists = await fs.exists(path);
    if (installedContent === null || !exists || (await fs.readFile(path)) !== installedContent) {
      continue;
    }
    const priorContent = before[relativePath];
    if (priorContent === null || priorContent === undefined) await fs.remove(path);
    else await fs.writeFile(path, priorContent);
  }
  for (const directory of [join(projectRoot, 'plugins'), join(projectRoot, 'services', '_shared')]) {
    if (await fs.exists(directory) && (await fs.readDir(directory)).length === 0) {
      await fs.remove(directory);
    }
  }
}

async function pruneEmptyGeneratedParents(projectRoot: string, fs: FileSystemPort): Promise<void> {
  for (const directory of [
    join(projectRoot, '.netscript', 'generated'),
    join(projectRoot, '.netscript'),
  ]) {
    if (await fs.exists(directory) && (await fs.readDir(directory)).length === 0) {
      await fs.remove(directory);
    }
  }
}
