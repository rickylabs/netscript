import type { PluginEntry } from '@netscript/aspire/types';
import { copyPluginSchemasToRootDb } from '../../../../kernel/adapters/plugin/db-integration.ts';
import { PluginKindRegistry } from '../../../../kernel/application/registries/plugin-kind-registry.ts';
import { PluginWorkspaceMutator } from '../../../../kernel/adapters/plugin/workspace-mutator.ts';
import { regenerateAspireHelpers } from '../../../../kernel/adapters/service/workspace-mutator.ts';
import { SCAFFOLD_DIRS } from '../../../../kernel/constants/scaffold/scaffold-dirs.ts';
import type {
  PluginInfrastructureDependency,
  PluginKindProvider,
  PluginPortRangeKey,
  ScaffoldedPluginType,
} from '../../../../kernel/domain/plugin-kind.ts';
import type { PluginScaffoldResult } from '../../../../kernel/domain/plugin-kind.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { PromptPort } from '../../../../kernel/ports/prompt-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import type { AddPluginResult, PluginAddPlan } from '../../../domain/plugin-add-plan.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import {
  canCopyOfficialPlugin,
  copyOfficialPlugin,
  findOfficialPluginSourceRoot,
  getOfficialPluginSource,
  registerOfficialPluginKindProviders,
} from '../../../../maintainer/maintainer-api.ts';
import {
  mergeUniqueReferences,
  resolveOfficialPluginSourceRoot,
  toWorkspaceRelativePath,
  usesPluginOwnedBackgroundEntrypoint,
} from '../../../../local/features/plugins/add/add-local-plugin-helpers.ts';
import type { AddPluginInput } from './add-plugin-input.ts';
import type {
  JsrPluginValidatorPort,
  ValidatedPluginDescriptor,
} from './jsr-plugin-validator-port.ts';
import { planPluginAdd } from './plan-plugin-add.ts';
import { renderPlugin, type RenderPluginDependencies } from './render-plugin.ts';
import {
  BARE_PLUGIN_PACKAGE_ALIASES,
  resolvePluginPackageSpec,
} from './plugin-package-resolver.ts';
import { confirmPluginInstall } from './confirm-plugin-install.ts';

interface OfficialPluginRenderResult {
  readonly plugin: PluginScaffoldResult;
  readonly pluginReferences: readonly string[];
  readonly serviceReferences: readonly string[];
  readonly dependencyEntries: readonly DependencyPluginEntry[];
  readonly workspaceMembers: readonly string[];
}

interface DependencyPluginEntry {
  readonly configKey: string;
  readonly entry: PluginEntry;
}

interface ResolvedPluginBeforePlanning {
  readonly descriptor: ValidatedPluginDescriptor;
  readonly planningKind?: string;
}

/** Dependencies used by the public add-plugin flow. */
export interface AddPluginDependencies extends RenderPluginDependencies {
  /** Plugin kind registry. */
  readonly registry?: PluginKindRegistry;

  /** Static JSR validator used to resolve package specs before planning. */
  readonly pluginValidator?: JsrPluginValidatorPort;

  /** Prompt adapter used for third-party package confirmation. */
  readonly prompt?: PromptPort;

  /** Discover a first-party plugin source checkout. */
  readonly findSourceRoot?: typeof findOfficialPluginSourceRoot;

  /** Resolve first-party plugin metadata. */
  readonly getSource?: typeof getOfficialPluginSource;

  /** Copy a first-party plugin implementation. */
  readonly copyPlugin?: typeof copyOfficialPlugin;

  /** Decide whether a first-party implementation can satisfy this request. */
  readonly canCopyPlugin?: typeof canCopyOfficialPlugin;

  /** Starting directory used to discover the source checkout in prod-local mode. */
  readonly sourceRootStartDir?: string;

  /** Workspace config mutator for root project updates. */
  readonly workspaceMutator: PluginWorkspaceMutator;

  /** Filesystem used by AppHost helper regeneration. */
  readonly fs: FileSystemPort;

  /** Scaffold writer used by AppHost helper regeneration. */
  readonly scaffolder: ScaffolderPort;

  /** Template renderer used by AppHost helper regeneration. */
  readonly templateAdapter: TemplatePort;

  /** Helper regeneration override for tests. */
  readonly regenerateHelpers?: (
    projectRoot: string,
    fs: FileSystemPort,
    scaffolder: ScaffolderPort,
    templateAdapter: TemplatePort,
  ) => Promise<readonly string[]>;
}

/** Add a starter plugin workspace to an existing NetScript project. */
export async function addPlugin(
  request: AddPluginInput,
  dependencies: AddPluginDependencies,
): Promise<AddPluginResult> {
  const registry = dependencies.registry ?? new PluginKindRegistry();
  const resolvedPlugin = await resolvePluginDescriptorBeforePlanning(
    request.kind,
    registry,
    dependencies.pluginValidator,
  );
  if (resolvedPlugin !== undefined && dependencies.prompt !== undefined) {
    await confirmPluginInstall({
      descriptor: resolvedPlugin.descriptor,
      prompt: dependencies.prompt,
      skipConfirmation: request.skipConfirmation,
      ci: request.ci,
    });
  }
  const planningRequest = resolvedPlugin?.planningKind === undefined
    ? request
    : { ...request, kind: resolvedPlugin.planningKind };
  const sourceRoot = await resolveOfficialPluginSourceRoot(request.projectRoot, dependencies);
  if (sourceRoot) {
    await registerOfficialPluginKindProviders(registry, sourceRoot);
  }
  const plan = await planPluginAdd(planningRequest, {
    fs: dependencies.fs,
    registry,
  });
  const rendered = await renderPlugin(plan, dependencies);
  const official = await maybeCopyOfficialPlugin(plan, dependencies, sourceRoot);
  const plugin = official?.plugin ?? rendered.plugin;

  const schemaCopies = await copyPluginSchemasToRootDb(
    plan.projectRoot,
    plan.pluginName,
    plan.dbDetection,
    { fs: dependencies.fs, scaffolder: dependencies.scaffolder },
    { overwrite: plan.overwrite },
  );
  for (const dependency of official?.dependencyEntries ?? []) {
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
    plugin,
    plan.provider,
    {
      serviceReferences: mergeUniqueReferences(
        plan.serviceReferences,
        official?.serviceReferences ?? [],
      ),
      pluginReferences: mergeUniqueReferences(
        plan.pluginReferences,
        official?.pluginReferences ?? [],
      ),
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
    official?.workspaceMembers ?? [],
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
    resolvedPlugin: resolvedPlugin?.descriptor,
    plugin,
    provisionedCache,
    schemaCopies,
    helperFiles,
  };
}

async function resolvePluginDescriptorBeforePlanning(
  spec: string,
  registry: PluginKindRegistry,
  validator: JsrPluginValidatorPort | undefined,
): Promise<ResolvedPluginBeforePlanning | undefined> {
  const alias = BARE_PLUGIN_PACKAGE_ALIASES[spec.trim().toLowerCase()];
  const shouldResolvePackage = alias !== undefined || spec.trim().startsWith('@') ||
    spec.trim().startsWith('jsr:');
  if (!shouldResolvePackage) {
    return undefined;
  }
  if (validator === undefined) {
    return undefined;
  }

  const resolvedPackage = resolvePluginPackageSpec(spec);
  const validation = await validator.validate(resolvedPackage);
  if (!validation.ok) {
    throw new ScaffoldValidationError(validation.error.message, {
      code: validation.error.code,
      package: resolvedPackage.packageSpecifier,
    });
  }

  const provider = normalizeManifestProvider(validation.descriptor.manifest.provider);
  if (provider !== undefined) {
    registry.register(provider.kind, provider);
  }
  return {
    descriptor: validation.descriptor,
    planningKind: provider?.kind,
  };
}

function normalizeManifestProvider(provider: ValidatedPluginDescriptor['manifest']['provider']):
  | PluginKindProvider
  | undefined {
  if (provider === undefined) {
    return undefined;
  }
  const portRangeKey = parsePortRangeKey(provider.portRangeKey);
  const watchFlag = parseWatchFlag(provider.watchFlag);
  const pluginType = parseScaffoldedPluginType(provider.pluginType);
  const infrastructureRequires = parseInfrastructureDependencies(provider.infrastructureRequires);
  const infrastructureOptionalDeps = parseInfrastructureDependencies(
    provider.infrastructureOptionalDeps,
  );
  if (
    portRangeKey === undefined || watchFlag === undefined || pluginType === undefined ||
    infrastructureRequires === undefined || infrastructureOptionalDeps === undefined
  ) {
    return undefined;
  }

  return {
    kind: provider.kind,
    displayName: provider.displayName,
    category: provider.category,
    portRangeKey,
    defaultPermissions: provider.defaultPermissions,
    watchFlag,
    defaultEntrypoint: provider.defaultEntrypoint,
    defaultServiceEntrypoint: provider.defaultServiceEntrypoint,
    defaultRequiresDb: provider.defaultRequiresDb,
    defaultRequiresKv: provider.defaultRequiresKv,
    pluginType,
    supportsConcurrency: provider.supportsConcurrency,
    concurrencyEnvVar: provider.concurrencyEnvVar,
    defaultConcurrency: provider.defaultConcurrency,
    defaultTelemetry: provider.defaultTelemetry,
    infrastructureRequires,
    infrastructureOptionalDeps,
  };
}

function parsePortRangeKey(value: string): PluginPortRangeKey | undefined {
  if (value === 'PLUGIN_API' || value === 'INFRA_PLUGIN') {
    return value;
  }
  return undefined;
}

function parseWatchFlag(value: string | undefined): '--watch' | '--watch-hmr' | undefined {
  if (value === undefined || value === '--watch') {
    return '--watch';
  }
  if (value === '--watch-hmr') {
    return value;
  }
  return undefined;
}

function parseScaffoldedPluginType(value: string): ScaffoldedPluginType | undefined {
  if (value === 'background-processor' || value === 'utility') {
    return value;
  }
  return undefined;
}

function parseInfrastructureDependencies(
  values: readonly string[],
): readonly PluginInfrastructureDependency[] | undefined {
  const parsed: PluginInfrastructureDependency[] = [];
  for (const value of values) {
    if (value !== 'kv' && value !== 'db' && value !== 'cache') {
      return undefined;
    }
    parsed.push(value);
  }
  return parsed;
}

async function maybeCopyOfficialPlugin(
  plan: PluginAddPlan,
  dependencies: AddPluginDependencies,
  sourceRoot: string | null,
): Promise<OfficialPluginRenderResult | null> {
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
    importMode: 'jsr',
    force: plan.overwrite,
    includeSamples: plan.includeSamples,
  });
  const getSource = dependencies.getSource ?? getOfficialPluginSource;
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
    workspaceMembers: result.workspaceMembers,
  };
}
