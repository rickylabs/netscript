import { join } from '@std/path';

import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';
import type {
  PluginWorkspaceMutator,
  RemovedPluginAppsettingsEntries,
} from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import type { PluginDispatchPort, PluginDispatchResult } from '../dispatch/plugin-dispatch-port.ts';

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
}

/** Remove a plugin from host configuration and dispatch the plugin remove verb. */
export async function removePlugin(
  input: RemovePluginInput,
  dependencies: RemovePluginDependencies,
): Promise<RemovePluginResult> {
  const removedAppsettings = await dependencies.workspaceMutator.removeAppsettingsEntries(
    input.projectRoot,
    input.pluginName,
  );
  const removedGeneratedDirs = await removeGeneratedPluginDirs(
    input.projectRoot,
    input.pluginName,
    dependencies.fs,
  );
  const dispatchResult = input.skipDispatch ? undefined : await dependencies.dispatchPort.dispatch({
    verb: 'remove',
    pkg: input.packageName ?? input.pluginName,
    args: [input.pluginName],
    projectRoot: input.projectRoot,
    processRunner: dependencies.processRunner,
  });

  return {
    removedAppsettings,
    removedGeneratedDirs,
    dispatchResult,
  };
}

async function removeGeneratedPluginDirs(
  projectRoot: string,
  pluginName: string,
  fs: FileSystemPort,
): Promise<readonly string[]> {
  const candidates = [
    join(projectRoot, '.netscript', 'generated', pluginName),
    join(projectRoot, '.netscript', 'generated', `plugin-${pluginName}`),
  ];
  const removed: string[] = [];

  for (const path of candidates) {
    if (!await fs.exists(path)) continue;
    await fs.remove(path);
    removed.push(path);
  }

  return removed;
}
