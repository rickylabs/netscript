import { join } from '@std/path';
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
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import { PluginKindRegistry } from '../../../../kernel/application/registries/plugin-kind-registry.ts';
import type {
  AddPluginResult,
  PluginAddPlan,
  PluginRenderResult,
} from '../../../../public/domain/plugin-add-plan.ts';
import type { AddPluginInput } from '../../../../public/features/plugins/add/add-plugin-input.ts';
import type { JsrPluginValidatorPort } from '../../../../public/features/plugins/add/jsr-plugin-validator-port.ts';
import type { JsrPackageFileFetcher } from '../../../../public/infra/jsr/verify-jsr-package-integrity.ts';
import {
  createPluginOwnedPluginResult,
  resolvePluginDescriptorBeforePlanning,
  runPluginOwnedScaffold,
} from '../../../../public/features/plugins/add/add-plugin.ts';
import { planPluginAdd } from '../../../../public/features/plugins/add/plan-plugin-add.ts';
import { resolvePluginPackageSpec } from '../../../../public/features/plugins/add/plugin-package-resolver.ts';
import { renderPluginSupport } from '../../../../public/features/plugins/add/render-plugin.ts';
import { ensurePluginServiceContext, mergeUniqueReferences } from './add-local-plugin-helpers.ts';
import { resolveOfficialPluginSourceRoot } from './add-local-plugin-helpers.ts';

export { resolveOfficialPluginSourceRoot } from './add-local-plugin-helpers.ts';

interface LocalPluginRenderResult extends PluginRenderResult {
  readonly workspaceMembers: readonly string[];
  readonly pluginReferences: readonly string[];
  readonly serviceReferences: readonly string[];
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
  /** Static JSR validator used when local mode is explicitly pointed at JSR. */
  readonly pluginValidator?: JsrPluginValidatorPort;
  /** Process runner reserved for plugin-owned scaffold execution. */
  readonly processRunner?: ProcessPort;
  /** JSR file fetcher used for plugin-owned scaffold integrity checks. */
  readonly packageFileFetcher?: JsrPackageFileFetcher;
  /** Discover a first-party plugin source checkout. */
  readonly findSourceRoot?: (startDir?: string) => Promise<string | null>;
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
  const descriptorRequest = await withDefaultLocalPath(request, dependencies);
  const resolvedPlugin = await resolvePluginDescriptorBeforePlanning(
    descriptorRequest,
    registry,
    dependencies.pluginValidator,
    dependencies.fs,
  );
  const planningRequest = resolvedPlugin?.planningKind === undefined
    ? descriptorRequest
    : { ...descriptorRequest, kind: resolvedPlugin.planningKind };
  const plan = await planPluginAdd(planningRequest, {
    fs: dependencies.fs,
    registry,
  });
  const pluginOwned = resolvedPlugin === undefined || dependencies.processRunner === undefined
    ? undefined
    : await runPluginOwnedScaffold(plan, resolvedPlugin, descriptorRequest, dependencies);
  const rendered = pluginOwned === undefined || resolvedPlugin === undefined
    ? await renderLocalPlugin(plan, dependencies)
    : {
      ...await renderPluginSupport(plan, dependencies, {
        importMode: 'local',
        localBase: ROOT_LOCAL_BASE,
      }),
      plugin: createPluginOwnedPluginResult(plan, resolvedPlugin.descriptor, pluginOwned),
      workspaceMembers: [],
      pluginReferences: mergeUniqueReferences(
        plan.pluginReferences,
        resolvedPlugin.descriptor.manifest.officialSource?.pluginReferences ?? [],
      ),
      serviceReferences: plan.serviceReferences,
    };

  const schemaCopies = await copyPluginSchemasToRootDb(
    plan.projectRoot,
    plan.pluginName,
    plan.dbDetection,
    { fs: dependencies.fs, scaffolder: dependencies.scaffolder },
    { overwrite: plan.overwrite },
  );
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
  await dependencies.workspaceMutator.ensureRootImportsForPluginKind(plan.projectRoot, plan.kind);
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

async function withDefaultLocalPath(
  request: AddPluginInput,
  dependencies: AddLocalPluginDependencies,
): Promise<AddPluginInput> {
  if (request.localPath !== undefined || request.jsrUrl !== undefined) {
    return request;
  }

  const sourceRoot = await resolveOfficialPluginSourceRoot(request.projectRoot, dependencies);
  if (sourceRoot === null) {
    return request;
  }

  return {
    ...request,
    localPath: resolveDefaultLocalPluginPath(sourceRoot, request.kind),
  };
}

function resolveDefaultLocalPluginPath(sourceRoot: string, kind: string): string {
  try {
    const resolved = resolvePluginPackageSpec(kind);
    if (resolved.scope === 'netscript' && resolved.packageName.startsWith('plugin-')) {
      return join(sourceRoot, SCAFFOLD_DIRS.PLUGINS, resolved.packageName.slice('plugin-'.length));
    }
  } catch {
    // Non-package local kinds fall back to the raw plugin directory name.
  }
  return join(sourceRoot, SCAFFOLD_DIRS.PLUGINS, kind);
}

async function renderLocalPlugin(
  plan: PluginAddPlan,
  dependencies: AddLocalPluginDependencies,
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
