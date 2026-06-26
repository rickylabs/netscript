import { join } from '@std/path';
import type { PluginEntry } from '@netscript/aspire/types';
import {
  copyPluginSchemasToRootDb,
  provisionDatabaseIfNeeded,
} from '../../../../kernel/adapters/plugin/db-integration.ts';
import { PluginRegistryScaffolder } from '../../../../kernel/adapters/plugin/registry-scaffolder.ts';
import { PluginScaffolder } from '../../../../kernel/adapters/plugin/scaffolder.ts';
import { PluginWorkspaceMutator } from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import { regenerateAspireHelpers } from '../../../../kernel/adapters/service/workspace-mutator.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../../../kernel/constants/scaffold/scaffold-files.ts';
import type { PluginScaffoldResult } from '../../../../kernel/domain/plugin-kind.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import {
  canCopyOfficialPlugin,
  copyOfficialPlugin,
  findOfficialPluginSourceRoot,
  getOfficialPluginSource,
  registerOfficialPluginKindProviders,
} from '../../../../maintainer/maintainer-api.ts';
import { PluginKindRegistry } from '../../../../kernel/application/registries/plugin-kind-registry.ts';
import type {
  AddPluginResult,
  PluginAddPlan,
  PluginRenderResult,
} from '../../../../public/domain/plugin-add-plan.ts';
import type { AddPluginInput } from '../../../../public/features/plugins/add/add-plugin-input.ts';
import { planPluginAdd } from '../../../../public/features/plugins/add/plan-plugin-add.ts';
import {
  ensurePluginServiceContext,
  mergeUniqueReferences,
  resolveOfficialPluginSourceRoot,
  toWorkspaceRelativePath,
  usesPluginOwnedBackgroundEntrypoint,
} from './add-local-plugin-helpers.ts';

export { resolveOfficialPluginSourceRoot } from './add-local-plugin-helpers.ts';

interface LocalPluginRenderResult extends PluginRenderResult {
  readonly workspaceMembers: readonly string[];
  readonly pluginReferences: readonly string[];
  readonly serviceReferences: readonly string[];
  readonly dependencyEntries: readonly DependencyPluginEntry[];
}

interface DependencyPluginEntry {
  readonly configKey: string;
  readonly entry: PluginEntry;
}

const ROOT_LOCAL_BASE = '.';
const PLUGIN_LOCAL_BASE = '../..';

/** Dependencies used by the local contributor plugin-add flow. */
export interface AddLocalPluginDependencies {
  /** Filesystem used for validation and workspace mutation. */
  readonly fs: FileSystemPort;
  /** Scaffold writer used by starter and DB flows. */
  readonly scaffolder: ScaffolderPort;
  /** Template renderer used by starter and DB flows. */
  readonly templateAdapter: TemplatePort;
  /** Plugin kind registry. */
  readonly registry?: PluginKindRegistry;
  /** Starter plugin scaffolder. */
  readonly pluginScaffolder: PluginScaffolder;
  /** Empty plugin registry scaffolder. */
  readonly registryScaffolder: PluginRegistryScaffolder;
  /** Workspace config mutator for root project updates. */
  readonly workspaceMutator: PluginWorkspaceMutator;
  /** Discover a first-party plugin source checkout. */
  readonly findSourceRoot?: typeof findOfficialPluginSourceRoot;
  /** Resolve first-party plugin metadata. */
  readonly getSource?: typeof getOfficialPluginSource;
  /** Copy a first-party plugin implementation. */
  readonly copyPlugin?: typeof copyOfficialPlugin;
  /** Decide whether a first-party implementation can satisfy this request. */
  readonly canCopyPlugin?: typeof canCopyOfficialPlugin;
  /** Starting directory used to discover the contributor source checkout. */
  readonly sourceRootStartDir?: string;
  /** Helper regeneration override for tests. */
  readonly regenerateHelpers?: (
    projectRoot: string,
    fs: FileSystemPort,
    scaffolder: ScaffolderPort,
    templateAdapter: TemplatePort,
  ) => Promise<readonly string[]>;
}

/** Add a plugin workspace to a local contributor project using local imports. */
export async function addLocalPlugin(
  request: AddPluginInput,
  dependencies: AddLocalPluginDependencies,
): Promise<AddPluginResult> {
  const registry = dependencies.registry ?? new PluginKindRegistry();
  const sourceRoot = await resolveOfficialPluginSourceRoot(request.projectRoot, dependencies);
  if (sourceRoot) {
    await registerOfficialPluginKindProviders(registry, sourceRoot);
  }
  const plan = await planPluginAdd(request, {
    fs: dependencies.fs,
    registry,
  });
  const rendered = await renderLocalPlugin(plan, dependencies, sourceRoot);

  const schemaCopies = await copyPluginSchemasToRootDb(
    plan.projectRoot,
    plan.pluginName,
    plan.dbDetection,
    { fs: dependencies.fs, scaffolder: dependencies.scaffolder },
    { overwrite: plan.overwrite },
  );
  for (const dependency of rendered.dependencyEntries) {
    await dependencies.workspaceMutator.upsertPluginAppsettingsEntry(
      plan.projectRoot,
      dependency.configKey,
      dependency.entry,
    );
    await dependencies.workspaceMutator.ensureNetScriptConfigPlugin(
      plan.projectRoot,
      dependency.configKey,
    );
  }
  await dependencies.workspaceMutator.updateAppsettings(
    plan.projectRoot,
    rendered.plugin,
    plan.provider,
    {
      serviceReferences: mergeUniqueReferences(plan.serviceReferences, rendered.serviceReferences),
      pluginReferences: mergeUniqueReferences(plan.pluginReferences, rendered.pluginReferences),
      sagaStoreBackend: plan.sagaStoreBackend,
    },
  );
  await dependencies.workspaceMutator.ensureNetScriptConfigPlugin(
    plan.projectRoot,
    plan.pluginName,
  );
  const provisionedCache = plan.provider.defaultRequiresKv
    ? await dependencies.workspaceMutator.ensureSharedCache(plan.projectRoot)
    : false;

  await dependencies.workspaceMutator.ensureWorkspaceMember(
    plan.projectRoot,
    rendered.workspaceMembers,
  );

  const regenerateHelpers = dependencies.regenerateHelpers ?? regenerateAspireHelpers;
  const helperFiles = await regenerateHelpers(
    plan.projectRoot,
    dependencies.fs,
    dependencies.scaffolder,
    dependencies.templateAdapter,
  );

  return {
    ...rendered,
    provisionedCache,
    schemaCopies,
    helperFiles,
  };
}

async function renderLocalPlugin(
  plan: PluginAddPlan,
  dependencies: AddLocalPluginDependencies,
  sourceRoot: string | null,
): Promise<LocalPluginRenderResult> {
  const provisionedDatabase = await provisionDatabaseIfNeeded(
    plan.projectRoot,
    plan.dbDetection,
    {
      projectName: plan.projectName,
      importMode: 'local',
      localBase: ROOT_LOCAL_BASE,
      overwrite: plan.overwrite,
    },
    {
      fs: dependencies.fs,
      scaffolder: dependencies.scaffolder,
      templateAdapter: dependencies.templateAdapter,
    },
  );
  const wroteServiceContext = await ensurePluginServiceContext(
    plan.projectRoot,
    dependencies.scaffolder,
    plan.overwrite,
  );
  const registryFilesCreated = await ensurePluginRegistry(plan, dependencies);
  const official = await maybeCopyOfficialPlugin(plan, dependencies, sourceRoot);
  if (official) {
    return {
      plugin: official.plugin,
      registryFilesCreated,
      wroteServiceContext,
      provisionedDatabase,
      workspaceMembers: official.workspaceMembers,
      pluginReferences: official.pluginReferences,
      serviceReferences: official.serviceReferences,
      dependencyEntries: official.dependencyEntries,
    };
  }

  const plugin = await dependencies.pluginScaffolder.scaffold({
    projectName: plan.projectName,
    targetPath: plan.projectRoot,
    kind: plan.kind,
    pluginName: plan.pluginName,
    importMode: 'local',
    localBase: PLUGIN_LOCAL_BASE,
    port: plan.port,
    serviceReferences: plan.serviceReferences,
    pluginReferences: plan.pluginReferences,
    requiresDb: plan.dbDetection.requiresDb,
    includeSamples: plan.includeSamples,
    force: plan.overwrite,
  });

  return {
    plugin,
    registryFilesCreated,
    wroteServiceContext,
    provisionedDatabase,
    workspaceMembers: [],
    pluginReferences: [],
    serviceReferences: [],
    dependencyEntries: [],
  };
}

async function maybeCopyOfficialPlugin(
  plan: PluginAddPlan,
  dependencies: AddLocalPluginDependencies,
  sourceRoot: string | null,
): Promise<
  {
    readonly plugin: PluginScaffoldResult;
    readonly workspaceMembers: readonly string[];
    readonly pluginReferences: readonly string[];
    readonly serviceReferences: readonly string[];
    readonly dependencyEntries: readonly DependencyPluginEntry[];
  } | null
> {
  const getSource = dependencies.getSource ?? getOfficialPluginSource;
  if (!sourceRoot) {
    return null;
  }
  if (plan.noCopySource === true) {
    return null;
  }

  const canCopyPlugin = dependencies.canCopyPlugin ?? canCopyOfficialPlugin;
  if (!await canCopyPlugin(sourceRoot, plan.kind, plan.pluginName)) {
    return null;
  }

  const copyPlugin = dependencies.copyPlugin ?? copyOfficialPlugin;
  const result = await copyPlugin({
    sourceRoot,
    targetPath: plan.projectRoot,
    projectName: plan.projectName,
    kind: plan.kind,
    pluginName: plan.pluginName,
    importMode: 'local',
    force: plan.overwrite,
    includeSamples: plan.includeSamples,
  });
  const source = await getSource(sourceRoot, plan.kind);

  return {
    plugin: {
      scaffoldResult: result.scaffoldResult,
      pluginDir: result.pluginDir,
      kind: plan.kind,
      port: result.backgroundPort,
      servicePort: result.servicePort,
      configSection: plan.provider.category === 'plugin' ? 'Plugins' : 'BackgroundProcessors',
      configKey: result.pluginName,
      serviceConfigKey: result.serviceConfigKey,
      backgroundWorkdir: usesPluginOwnedBackgroundEntrypoint(result)
        ? toWorkspaceRelativePath(plan.projectRoot, result.pluginDir)
        : result.backgroundDir
        ? toWorkspaceRelativePath(plan.projectRoot, result.backgroundDir)
        : undefined,
      serviceWorkdir: toWorkspaceRelativePath(plan.projectRoot, result.pluginDir),
    },
    workspaceMembers: result.workspaceMembers,
    pluginReferences: mergeUniqueReferences(
      source.pluginReferences ?? [],
      result.dependencies.map((dependency) => dependency.configKey),
    ),
    serviceReferences: [],
    dependencyEntries: result.dependencies.map((dependency) => ({
      configKey: dependency.configKey,
      entry: {
        Enabled: true,
        Runtime: 'deno',
        Port: dependency.servicePort,
        Entrypoint: dependency.serviceEntrypoint,
        Workdir: `${SCAFFOLD_DIRS.PLUGINS}/${dependency.pluginDir}`,
        RequiresDb: dependency.requiresDb,
        RequiresKv: dependency.requiresKv,
        Permissions: [...dependency.permissions],
      },
    })),
  };
}

async function ensurePluginRegistry(
  plan: PluginAddPlan,
  dependencies: AddLocalPluginDependencies,
): Promise<number> {
  if (!await needsRegistryBootstrap(plan.projectRoot, dependencies.fs)) {
    return 0;
  }

  const registryResult = await dependencies.registryScaffolder.scaffold({
    projectName: plan.projectName,
    targetPath: plan.projectRoot,
    importMode: 'local',
    localBase: ROOT_LOCAL_BASE,
    force: false,
  });
  return registryResult.filesCreated.length;
}

async function needsRegistryBootstrap(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<boolean> {
  const pluginsRoot = join(projectRoot, SCAFFOLD_DIRS.PLUGINS);
  const requiredFiles = [
    join(pluginsRoot, SCAFFOLD_FILES.DENO_JSON),
    join(pluginsRoot, SCAFFOLD_FILES.MOD),
  ];

  if (!await fs.exists(pluginsRoot)) {
    return true;
  }

  for (const path of requiredFiles) {
    if (!await fs.exists(path)) {
      return true;
    }
  }

  return false;
}
