import {
  parsePluginManifest,
  type ScaffoldResult as PluginOwnedScaffoldResult,
} from '@netscript/plugin/protocol';
import { join } from '@std/path';
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
import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import type { InstallPluginResult, PluginInstallPlan } from '../../../domain/plugin-install-plan.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import {
  mergeUniqueReferences,
  toWorkspaceRelativePath,
} from '../../../../local/features/plugins/install/install-local-plugin-helpers.ts';
import type { InstallPluginInput } from './install-plugin-input.ts';
import type {
  JsrPluginValidatorPort,
  ValidatedPluginDescriptor,
} from './jsr-plugin-validator-port.ts';
import { planPluginInstall } from './plan-plugin-install.ts';
import {
  type RenderPluginDependencies,
  renderPluginSupport,
} from './render-plugin.ts';
import {
  BARE_PLUGIN_PACKAGE_ALIASES,
  resolvePluginPackageSpec,
} from './plugin-package-resolver.ts';
import { confirmPluginInstall } from './confirm-plugin-install.ts';
import { buildPluginScaffoldPermissionFlags } from '../../../infra/permissions/plugin-scaffold-permissions.ts';
import {
  dispatchPluginScaffold,
  type PluginScaffoldDispatchSource,
} from '../dispatch/dispatch-plugin-verb.ts';
import type { JsrPackageFileFetcher } from '../../../infra/jsr/verify-jsr-package-integrity.ts';

export interface PluginOwnedScaffoldDependencies {
  /** Process runner used for plugin-owned scaffold and post-script dispatch. */
  readonly processRunner?: ProcessPort;

  /** JSR package file fetcher used for integrity verification. */
  readonly packageFileFetcher?: JsrPackageFileFetcher;
}

export interface ResolvedPluginBeforePlanning {
  readonly descriptor: ValidatedPluginDescriptor;
  readonly planningKind?: string;
  readonly source: PluginScaffoldDispatchSource;
}

/** Dependencies used by the public install-plugin flow. */
export interface InstallPluginDependencies
  extends RenderPluginDependencies, PluginOwnedScaffoldDependencies {
  /** Plugin kind registry. */
  readonly registry?: PluginKindRegistry;

  /** Static JSR validator used to resolve package specs before planning. */
  readonly pluginValidator?: JsrPluginValidatorPort;

  /** Prompt adapter used for third-party package confirmation. */
  readonly prompt?: PromptPort;

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

/** Install a starter plugin workspace into an existing NetScript project. */
export async function installPlugin(
  request: InstallPluginInput,
  dependencies: InstallPluginDependencies,
): Promise<InstallPluginResult> {
  const registry = dependencies.registry ?? new PluginKindRegistry();
  const resolvedPlugin = await resolvePluginDescriptorBeforePlanning(
    request,
    registry,
    dependencies.pluginValidator,
    dependencies.fs,
  );
  if (resolvedPlugin !== undefined) {
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
  const plan = await planPluginInstall(planningRequest, {
    fs: dependencies.fs,
    registry,
  });
  const pluginOwned = resolvedPlugin === undefined || dependencies.processRunner === undefined
    ? undefined
    : await runPluginOwnedScaffold(plan, resolvedPlugin, request, dependencies);
  if (request.dryRun === true && pluginOwned !== undefined && resolvedPlugin !== undefined) {
    return createDryRunInstallResult(plan, resolvedPlugin.descriptor, pluginOwned);
  }
  if (pluginOwned === undefined || resolvedPlugin === undefined) {
    throw new ScaffoldValidationError(
      'Plugin installation requires a resolvable plugin package and a process runner to ' +
        'dispatch the plugin-owned scaffolder. Provide --jsr-url or --local-path for a plugin ' +
        'whose package exposes a scaffolder, and ensure a process runner is configured.',
      { package: request.jsrUrl ?? request.localPath ?? request.kind },
    );
  }
  const rendered = {
    ...await renderPluginSupport(plan, dependencies, { importMode: 'jsr' }),
    plugin: createPluginOwnedPluginResult(plan, resolvedPlugin.descriptor, pluginOwned),
  };
  const pluginReferences = resolvedPlugin === undefined
    ? plan.pluginReferences
    : mergeUniqueReferences(
      plan.pluginReferences,
      resolvedPlugin.descriptor.manifest.officialSource?.pluginReferences ?? [],
    );

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
      serviceReferences: plan.serviceReferences,
      pluginReferences,
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

  await dependencies.workspaceMutator.ensureWorkspaceMember(plan.projectRoot);

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
    pluginOwnedScaffold: pluginOwned,
    provisionedCache,
    schemaCopies,
    helperFiles,
  };
}

export async function resolvePluginDescriptorBeforePlanning(
  request: InstallPluginInput,
  registry: PluginKindRegistry,
  validator: JsrPluginValidatorPort | undefined,
  fs: FileSystemPort,
): Promise<ResolvedPluginBeforePlanning | undefined> {
  if (request.localPath !== undefined) {
    return await resolveLocalPluginDescriptor(request.localPath, registry, fs);
  }

  const spec = request.jsrUrl ?? request.kind;
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
    source: { kind: 'jsr', specifier: validation.descriptor.package.jsrSpecifier },
  };
}

export async function resolveLocalPluginDescriptor(
  localPath: string,
  registry: PluginKindRegistry,
  fs: FileSystemPort,
): Promise<ResolvedPluginBeforePlanning> {
  const manifestJson = JSON.parse(await fs.readFile(join(localPath, 'scaffold.plugin.json')));
  const parsed = parsePluginManifest(manifestJson);
  if (!parsed.ok) {
    throw new ScaffoldValidationError(parsed.error.message, {
      code: 'invalid-manifest',
      package: localPath,
    });
  }
  const provider = normalizeManifestProvider(parsed.manifest.provider);
  if (provider !== undefined) {
    registry.register(provider.kind, provider);
  }
  const resolvedPackage = resolvePluginPackageSpec(parsed.manifest.name);
  return {
    descriptor: {
      package: resolvedPackage,
      version: parsed.manifest.version,
      manifest: parsed.manifest,
      packageMetadata: { latest: parsed.manifest.version, isYanked: false },
      versionMetadata: {
        exports: { [parsed.manifest.scaffolder.export]: parsed.manifest.scaffolder.export },
        files: {},
      },
      details: { description: parsed.manifest.description },
    },
    planningKind: provider?.kind,
    source: { kind: 'local-path', path: localPath },
  };
}

export async function runPluginOwnedScaffold(
  plan: PluginInstallPlan,
  resolvedPlugin: ResolvedPluginBeforePlanning,
  request: InstallPluginInput,
  dependencies: PluginOwnedScaffoldDependencies,
): Promise<PluginOwnedScaffoldResult> {
  const processRunner = dependencies.processRunner;
  if (processRunner === undefined) {
    throw new ScaffoldValidationError('Plugin-owned scaffolding requires a process runner.');
  }
  const permissionFlags = buildPluginScaffoldPermissionFlags({
    descriptor: resolvedPlugin.descriptor,
    projectRoot: plan.projectRoot,
    pluginName: plan.pluginName,
    allowFreshFirstPartyDependency: true,
  });
  return await dispatchPluginScaffold({
    descriptor: resolvedPlugin.descriptor,
    source: resolvedPlugin.source,
    projectRoot: plan.projectRoot,
    pluginName: plan.pluginName,
    dryRun: request.dryRun === true,
    permissionFlags,
    processRunner,
    fileFetcher: dependencies.packageFileFetcher,
  });
}

export function createDryRunInstallResult(
  plan: PluginInstallPlan,
  descriptor: ValidatedPluginDescriptor,
  scaffold: PluginOwnedScaffoldResult,
): InstallPluginResult {
  const filesCreated = scaffold.createdFiles.map((path) => join(plan.projectRoot, path));
  const pluginDir = join(plan.projectRoot, SCAFFOLD_DIRS.PLUGINS, plan.pluginName);
  return {
    resolvedPlugin: descriptor,
    pluginOwnedScaffold: scaffold,
    plugin: {
      scaffoldResult: {
        filesCreated,
        directoriesCreated: [],
        filesSkipped: scaffold.modifiedFiles.map((path) => join(plan.projectRoot, path)),
        totalOperations: scaffold.createdFiles.length + scaffold.modifiedFiles.length,
        durationMs: 0,
      },
      pluginDir,
      kind: plan.kind,
      port: plan.port ?? plan.provider.defaultConcurrency ?? 0,
      servicePort: plan.port ?? 0,
      configSection: plan.provider.category === 'plugin' ? 'Plugins' : 'BackgroundProcessors',
      configKey: plan.pluginName,
      serviceConfigKey: `${plan.pluginName}-api`,
      serviceWorkdir: toWorkspaceRelativePath(plan.projectRoot, pluginDir),
    },
    registryFilesCreated: 0,
    wroteServiceContext: false,
    provisionedDatabase: null,
    provisionedCache: false,
    schemaCopies: [],
    helperFiles: [],
  };
}

/** Convert a plugin-owned scaffold result into the host appsettings plugin shape. */
export function createPluginOwnedPluginResult(
  plan: PluginInstallPlan,
  descriptor: ValidatedPluginDescriptor,
  scaffold: PluginOwnedScaffoldResult,
): PluginScaffoldResult {
  const officialSource = descriptor.manifest.officialSource;
  const pluginDir = join(plan.projectRoot, SCAFFOLD_DIRS.PLUGINS, plan.pluginName);
  const servicePort = plan.port ?? officialSource?.servicePort ?? 0;
  const backgroundPort = plan.port ?? officialSource?.backgroundPort ?? servicePort;
  const serviceConfigKey = plan.provider.category === 'plugin'
    ? plan.pluginName
    : officialSource?.serviceConfigKey ?? `${plan.pluginName}-api`;

  return {
    scaffoldResult: {
      filesCreated: scaffold.createdFiles.map((path) => join(plan.projectRoot, path)),
      directoriesCreated: [],
      filesSkipped: scaffold.modifiedFiles.map((path) => join(plan.projectRoot, path)),
      totalOperations: scaffold.createdFiles.length + scaffold.modifiedFiles.length,
      durationMs: 0,
    },
    pluginDir,
    kind: plan.kind,
    port: backgroundPort,
    servicePort,
    configSection: plan.provider.category === 'plugin' ? 'Plugins' : 'BackgroundProcessors',
    configKey: plan.pluginName,
    serviceConfigKey,
    backgroundWorkdir: plan.provider.category === 'background-processor'
      ? toWorkspaceRelativePath(plan.projectRoot, pluginDir)
      : undefined,
    serviceWorkdir: toWorkspaceRelativePath(plan.projectRoot, pluginDir),
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
