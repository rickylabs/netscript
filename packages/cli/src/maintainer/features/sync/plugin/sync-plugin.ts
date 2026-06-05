import type { PluginKind } from '../../../../kernel/domain/plugin-kind.ts';

/** Import modes accepted by maintainer plugin sync. */
export type MaintainerPluginPackageSourceMode = 'jsr' | 'local';

/** Canonical plugin source metadata needed by the application service. */
export interface OfficialPluginSourceDescriptor {
  /** Canonical directory and config name for this plugin kind. */
  readonly canonicalName: string;
}

/** Request sent to the plugin copy adapter. */
export interface SyncPluginCopyRequest {
  /** Absolute path to the source checkout root. */
  readonly sourceRoot: string;
  /** Absolute path to the target project root. */
  readonly targetPath: string;
  /** Target project name used for workspace package names. */
  readonly projectName: string;
  /** Plugin kind to sync. */
  readonly kind: PluginKind;
  /** Plugin name inside the target project. */
  readonly pluginName: string;
  /** Import mode used when rewriting copied package imports. */
  readonly importMode: MaintainerPluginPackageSourceMode;
  /** Whether existing files may be overwritten. */
  readonly force: boolean;
  /** Whether sample jobs, tasks, sagas, and triggers stay wired. */
  readonly includeSamples: boolean;
}

/** Result returned by the plugin copy adapter. */
export interface SyncPluginCopyResult {
  /** Canonical plugin name that was copied. */
  readonly pluginName: string;
  /** Absolute plugin workspace directory. */
  readonly pluginDir: string;
  /** Optional background workspace directory. */
  readonly backgroundDir: string | null;
  /** Service config key written for the copied plugin. */
  readonly serviceConfigKey: string;
  /** Service port written for the copied plugin. */
  readonly servicePort: number;
  /** Background processor port from the official source. */
  readonly backgroundPort: number;
  /** Root workspace members that must exist after the copy. */
  readonly workspaceMembers: readonly string[];
  /** Files created by the copy operation. */
  readonly filesCreated: readonly string[];
  /** Directories created by the copy operation. */
  readonly directoriesCreated: readonly string[];
}

/** Maintainer sync-plugin request. */
export interface SyncPluginRequest {
  /** Starting directory used to discover the source checkout. */
  readonly startDir?: string;
  /** Explicit source checkout root override. */
  readonly sourceRoot?: string;
  /** Absolute path to the target project root. */
  readonly targetPath: string;
  /** Target project name used for workspace package names. */
  readonly projectName: string;
  /** Plugin kind to sync. */
  readonly kind: PluginKind;
  /** Optional plugin name override. Defaults to the canonical name. */
  readonly pluginName?: string;
  /** Import mode used when rewriting copied package imports. */
  readonly importMode?: MaintainerPluginPackageSourceMode;
  /** Whether existing files may be overwritten. */
  readonly force?: boolean;
  /** Whether sample jobs, tasks, sagas, and triggers stay wired. */
  readonly includeSamples?: boolean;
}

/** Final result returned by the maintainer sync-plugin workflow. */
export interface SyncPluginResult extends SyncPluginCopyResult {
  /** Source checkout root used for the copy. */
  readonly sourceRoot: string;
}

/** Dependencies used by the maintainer plugin sync flow. */
export interface SyncPluginDependencies {
  /** Resolve canonical metadata for the requested plugin kind. */
  readonly getSource: (
    sourceRoot: string,
    kind: PluginKind,
  ) => Promise<OfficialPluginSourceDescriptor>;
  /** Discover the source checkout when the caller did not provide one. */
  readonly findSourceRoot: (startDir?: string) => Promise<string | null>;
  /** Copy the official plugin source into the target project. */
  readonly copyPlugin: (request: SyncPluginCopyRequest) => Promise<SyncPluginCopyResult>;
}

/** Copy an official plugin implementation from the monorepo into a project. */
export async function syncPlugin(
  request: SyncPluginRequest,
  dependencies: SyncPluginDependencies,
): Promise<SyncPluginResult> {
  const sourceRoot = request.sourceRoot ??
    await dependencies.findSourceRoot(request.startDir);
  if (!sourceRoot) {
    throw new Error(
      'Could not find a NetScript source checkout for plugin sync. ' +
        'Run the command inside the monorepo or pass an explicit source root.',
    );
  }

  const pluginSource = await dependencies.getSource(sourceRoot, request.kind);
  const result = await dependencies.copyPlugin({
    sourceRoot,
    targetPath: request.targetPath,
    projectName: request.projectName,
    kind: request.kind,
    pluginName: request.pluginName ?? pluginSource.canonicalName,
    importMode: request.importMode ?? 'local',
    force: request.force ?? false,
    includeSamples: request.includeSamples ?? true,
  });

  return { sourceRoot, ...result };
}
