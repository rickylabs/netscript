import { fromFileUrl, isAbsolute, resolve } from '@std/path';
import { toFileUrl } from '@std/path/to-file-url';
import type { NetScriptConfig } from '@netscript/config';
import type {
  DoctorReport,
  NetScriptPlugin,
  PluginCommandContext,
} from '@netscript/plugin/adapter';

import type { RegisteredPluginConfig } from '../../../../kernel/domain/resolved-config.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ProcessPort } from '../../../../kernel/ports/process-port.ts';
import { loadRegisteredPluginMetadata } from '../../../../kernel/adapters/config/plugin-registry.ts';
import { probeConfiguredPluginManifest } from '../../../../kernel/adapters/config/configured-plugin-manifest-probe.ts';
import { resolvePluginImportSpecifier } from '../../../../kernel/application/plugin/configured-plugin-specifier.ts';
import { getPluginServiceLookupName } from '../../../../kernel/adapters/config/plugin-registry.ts';
import { showAuthBackend } from '../auth/auth-config.ts';
import { resolveEffectivePluginPermissions } from '../../../../kernel/adapters/config/deploy-config-resolvers.ts';
import { JsrExportMapHttpError, type JsrExportMapLoader } from './jsr-export-map-loader-port.ts';
import type { GenerateInstalledPluginRegistries } from '../../generate/plugins/generate-installed-plugin-registries.ts';
import { checkRuntimeRegistryDrift } from './runtime-registry-drift.ts';

export const CONFIGURED_MODULE_RESOLVES_CHECK = 'configured-module-resolves';
export const CONFIGURED_MODULE_EXPORTS_MANIFEST_CHECK = 'configured-module-exports-manifest';
export const SERVICE_ENTRYPOINT_RESOLVES_CHECK = 'service-entrypoint-resolves';

const CONFIGURED_MODULE_RESOLVES_TITLE = 'Configured module resolves';
const CONFIGURED_MODULE_EXPORTS_MANIFEST_TITLE = 'Configured module exports manifest';
const SERVICE_ENTRYPOINT_RESOLVES_TITLE = 'Service entrypoint resolves';

/** Health status for one plugin doctor check. */
export type PluginDoctorCheckStatus = 'healthy' | 'warning' | 'error';

/** One host-side plugin doctor check. */
export interface PluginDoctorCheck {
  /** Stable check identifier. */
  readonly id: string;
  /** Human-readable check title. */
  readonly title: string;
  /** Check outcome. */
  readonly status: PluginDoctorCheckStatus;
  /** Optional diagnostic detail. */
  readonly message?: string;
}

/** Doctor report for one installed plugin. */
export interface PluginDoctorReport {
  /** Plugin name or config key. */
  readonly pluginName: string;
  /** Aggregate plugin health status. */
  readonly status: PluginDoctorCheckStatus;
  /** Checks that produced the aggregate status. */
  readonly checks: readonly PluginDoctorCheck[];
}

/** Input passed to the plugin doctor use case. */
export interface PluginDoctorInput {
  /** Project root directory. */
  readonly projectRoot: string;
}

/** Dependencies for host-side plugin diagnostics. */
export interface PluginDoctorDependencies {
  /** Filesystem adapter for workspace checks. */
  readonly fs: FileSystemPort;
  /** Load `netscript.config.ts`. */
  readonly loadConfig: (options: { cwd: string }) => Promise<NetScriptConfig>;
  /** Load registered plugin manifests from config. */
  readonly loadRegisteredPlugins?: (
    projectRoot: string,
    config?: NetScriptConfig,
  ) => Promise<Record<string, RegisteredPluginConfig>>;
  /** Execute configured modules in a bounded child process. */
  readonly process: ProcessPort;
  /** Override the configured-module probe timeout in contract tests. */
  readonly configuredModuleTimeoutMs?: number;
  /** Load the declared exports for one exact JSR package version. */
  readonly loadJsrExportMap?: JsrExportMapLoader;
  /** Inspect the running Aspire AppHost for configured resource truth. */
  readonly inspectAppHost?: AppHostInspector;
  /** Inspect manifest-declared runtime registries without regenerating them. */
  readonly inspectRuntimeRegistries?: GenerateInstalledPluginRegistries;
}

/** One named resource observed from a running AppHost. */
export interface AppHostResourceState {
  readonly name: string;
  readonly state?: string;
  readonly healthStatus?: string;
  /** Raw Aspire readiness reports; an empty set cannot substantiate `Healthy`. */
  readonly healthReports?: readonly unknown[] | Readonly<Record<string, unknown>>;
}

/** Explicit AppHost lifecycle and resource snapshot. */
export type AppHostInspection =
  | { readonly status: 'not-running' }
  | { readonly status: 'unavailable'; readonly reason: string }
  | { readonly status: 'running'; readonly resources: readonly AppHostResourceState[] };

/** Runtime observation port used by plugin doctor. */
export interface AppHostInspector {
  inspect(projectRoot: string): Promise<AppHostInspection>;
}

/** Run host-side health checks for configured plugins. */
export async function doctorPlugin(
  input: PluginDoctorInput,
  dependencies: PluginDoctorDependencies,
): Promise<readonly PluginDoctorReport[]> {
  let config: NetScriptConfig;
  try {
    config = await dependencies.loadConfig({ cwd: input.projectRoot });
  } catch (error) {
    return configErrorReports(error);
  }

  const pluginSpecs = resolvePluginSpecs(config);
  const configuredModuleChecks = await Promise.all(
    pluginSpecs.map((spec) => checkConfiguredModule(input.projectRoot, spec, dependencies)),
  );
  const serviceChecks = await checkServiceEntrypoints(input.projectRoot, dependencies);
  const runtimeRegistryReport = await diagnoseRuntimeRegistries(input.projectRoot, dependencies);
  const appHostReport = dependencies.inspectAppHost
    ? await diagnoseAppHost(input.projectRoot, config, dependencies.inspectAppHost)
    : undefined;
  if (pluginSpecs.length === 0) {
    const serviceReport = serviceChecks.some((entry) => entry.check.status === 'error')
      ? workspaceChecksReport(serviceChecks)
      : undefined;
    return [appHostReport, runtimeRegistryReport, serviceReport].filter(isPluginDoctorReport);
  }

  let plugins: Record<string, RegisteredPluginConfig>;
  try {
    plugins = dependencies.loadRegisteredPlugins
      ? await dependencies.loadRegisteredPlugins(input.projectRoot, config)
      : await loadRegisteredPluginMetadata(input.projectRoot, config);
  } catch (error) {
    return [
      workspaceErrorReport('manifest-resolution', 'Could not resolve plugin manifests.', error),
    ];
  }

  const pluginEntries = Object.entries(plugins);
  const pluginKeys = new Set(pluginEntries.map(([key]) => key));
  const unmatchedServiceChecks = serviceChecks.filter((entry) =>
    entry.pluginKey !== undefined && !pluginKeys.has(getPluginServiceLookupName(entry.pluginKey))
  );
  const reports = await Promise.all(
    pluginEntries.map(([key, plugin], index) =>
      diagnosePlugin(input.projectRoot, plugin, dependencies, [
        ...(configuredModuleChecks[index] ?? []),
        ...serviceChecks.filter((check) =>
          check.pluginKey === undefined || getPluginServiceLookupName(check.pluginKey) === key
        ).map((check) => check.check),
      ])
    ),
  );
  const unmatchedServiceReport = unmatchedServiceChecks.length > 0
    ? workspaceChecksReport(unmatchedServiceChecks)
    : undefined;
  return [appHostReport, runtimeRegistryReport, ...reports, unmatchedServiceReport].filter(
    isPluginDoctorReport,
  );
}

async function diagnoseRuntimeRegistries(
  projectRoot: string,
  dependencies: PluginDoctorDependencies,
): Promise<PluginDoctorReport | undefined> {
  if (!dependencies.inspectRuntimeRegistries) return undefined;
  try {
    const registries = await dependencies.inspectRuntimeRegistries({
      dryRun: true,
      projectRoot,
    });
    const checks = await checkRuntimeRegistryDrift({
      fs: dependencies.fs,
      projectRoot,
      registries,
    });
    return { pluginName: 'workspace', status: aggregateStatus(checks), checks };
  } catch (error) {
    return workspaceErrorReport(
      'runtime-registry:inspection',
      'Runtime registry inspection',
      error,
    );
  }
}

async function diagnoseAppHost(
  projectRoot: string,
  config: NetScriptConfig,
  inspector: AppHostInspector,
): Promise<PluginDoctorReport> {
  try {
    const snapshot = await inspector.inspect(projectRoot);
    if (snapshot.status === 'unavailable') {
      return {
        pluginName: 'apphost',
        status: 'warning',
        checks: [{
          id: 'apphost:inspection-unavailable',
          title: 'Aspire AppHost inspection available',
          status: 'warning',
          message: snapshot.reason,
        }],
      };
    }
    if (snapshot.status === 'not-running') {
      return {
        pluginName: 'apphost',
        status: 'warning',
        checks: [{
          id: 'apphost:not-running',
          title: 'Aspire AppHost running',
          status: 'warning',
          message: 'No AppHost is running for this project. Start it and rerun plugin doctor.',
        }],
      };
    }
    const observed = new Map(snapshot.resources.map((resource) => [resource.name, resource]));
    const checks = configuredResourceNames(config).map((name): PluginDoctorCheck => {
      const resource = observed.get(name);
      if (!resource) {
        return {
          id: `apphost:missing:${name}`,
          title: `AppHost resource ${name}`,
          status: 'error',
          message: `Configured resource "${name}" is missing from the running AppHost.`,
        };
      }
      const reportsReady = resource.healthReports !== undefined &&
        (Array.isArray(resource.healthReports)
          ? resource.healthReports.length > 0
          : Object.keys(resource.healthReports).length > 0);
      const aspireHealthy = resource.state?.toLowerCase() === 'running' &&
        resource.healthStatus?.toLowerCase() === 'healthy';
      const status = !aspireHealthy ? 'error' : reportsReady ? 'healthy' : 'warning';
      return {
        id: `apphost:resource:${name}`,
        title: `AppHost resource ${name}`,
        status,
        message: status === 'healthy'
          ? 'Running and healthy'
          : status === 'warning'
          ? `Resource "${name}" reports Healthy but has no readiness evidence.`
          : `Resource "${name}" is ${resource.state ?? 'unknown'} / ${
            resource.healthStatus ?? 'unknown'
          }.`,
      };
    });
    return { pluginName: 'apphost', status: aggregateStatus(checks), checks };
  } catch (error) {
    return workspaceErrorReport('apphost:inspection', 'Could not inspect Aspire AppHost.', error);
  }
}

function configuredResourceNames(config: NetScriptConfig): readonly string[] {
  const databaseNames = config.databases.config.flatMap((database) =>
    database.name ? [database.name] : []
  );
  return [
    ...new Set([
      ...Object.keys(config.services ?? {}),
      ...Object.keys(config.apps ?? {}),
      ...databaseNames,
    ]),
  ].sort();
}

async function diagnosePlugin(
  projectRoot: string,
  plugin: RegisteredPluginConfig,
  dependencies: PluginDoctorDependencies,
  invariantChecks: readonly PluginDoctorCheck[],
): Promise<PluginDoctorReport> {
  if (plugin.manifestError) {
    const checks: PluginDoctorCheck[] = [...invariantChecks, {
      id: 'manifest-resolution',
      title: 'Manifest resolved',
      status: 'error',
      message: `${plugin.manifestError} Run: netscript plugin sync`,
    }];
    return { pluginName: plugin.name, status: 'error', checks };
  }

  const checks: PluginDoctorCheck[] = [
    ...invariantChecks,
    {
      id: 'manifest',
      title: 'Manifest resolved',
      status: 'healthy',
      message: plugin.displayName ?? plugin.name,
    },
    ...await checkPluginSource(projectRoot, plugin, dependencies.fs),
    await checkPermissions(projectRoot, plugin, dependencies.fs),
    ...await checkAuthBackend(projectRoot, plugin, dependencies.fs),
    ...await checkPluginDoctor(projectRoot, plugin, dependencies.fs),
  ];

  return {
    pluginName: plugin.name,
    status: aggregateStatus(checks),
    checks,
  };
}

async function checkConfiguredModule(
  projectRoot: string,
  spec: string,
  dependencies: PluginDoctorDependencies,
): Promise<readonly PluginDoctorCheck[]> {
  const importSpecifier = resolvePluginImportSpecifier(projectRoot, spec);
  const localModule = importSpecifier.startsWith('file:');
  if (localModule) {
    const path = fromFileUrl(importSpecifier);
    if (!await dependencies.fs.exists(path)) {
      return [
        check(
          CONFIGURED_MODULE_RESOLVES_CHECK,
          CONFIGURED_MODULE_RESOLVES_TITLE,
          'error',
          `Configured plugin module "${spec}" does not exist at ${path}.`,
        ),
        check(
          CONFIGURED_MODULE_EXPORTS_MANIFEST_CHECK,
          CONFIGURED_MODULE_EXPORTS_MANIFEST_TITLE,
          'error',
          `Manifest export was not checked because configured module "${spec}" is missing.`,
        ),
      ];
    }
  }

  const probe = await probeConfiguredPluginManifest(projectRoot, spec, dependencies.process, {
    timeoutMs: dependencies.configuredModuleTimeoutMs,
  });
  const resolves = check(
    CONFIGURED_MODULE_RESOLVES_CHECK,
    CONFIGURED_MODULE_RESOLVES_TITLE,
    localModule || probe.status === 'resolved' || probe.status === 'missing' ||
      probe.status === 'ambiguous'
      ? 'healthy'
      : 'error',
    localModule || probe.status === 'resolved' || probe.status === 'missing' ||
      probe.status === 'ambiguous'
      ? spec
      : formatProbeFailure(spec, probe),
  );
  const exportsManifest = probe.status === 'resolved'
    ? check(
      CONFIGURED_MODULE_EXPORTS_MANIFEST_CHECK,
      CONFIGURED_MODULE_EXPORTS_MANIFEST_TITLE,
      'healthy',
      spec,
    )
    : check(
      CONFIGURED_MODULE_EXPORTS_MANIFEST_CHECK,
      CONFIGURED_MODULE_EXPORTS_MANIFEST_TITLE,
      'error',
      formatProbeFailure(spec, probe),
    );
  return [resolves, exportsManifest];
}

function formatProbeFailure(
  spec: string,
  probe: Awaited<ReturnType<typeof probeConfiguredPluginManifest>>,
): string {
  switch (probe.status) {
    case 'timeout':
      return `Configured plugin module "${spec}" timed out after ${probe.timeoutMs}ms.`;
    case 'non-zero':
      return `Configured plugin module "${spec}" exited non-zero (${probe.code}): ${probe.message}`;
    case 'import-failure':
      return `Configured plugin module "${spec}" failed to import: ${probe.message}`;
    case 'malformed-payload':
      return `Configured plugin module "${spec}" returned invalid manifest metadata: ${probe.message}`;
    case 'missing':
      return `Configured plugin module "${spec}" exports no manifest-shaped value.`;
    case 'ambiguous':
      return `Configured plugin module "${spec}" exports ${probe.count} named manifest-shaped values and no default manifest.`;
    case 'resolved':
      return spec;
  }
}

interface ServiceEntrypointCheck {
  readonly pluginKey?: string;
  readonly check: PluginDoctorCheck;
}

async function checkServiceEntrypoints(
  projectRoot: string,
  dependencies: PluginDoctorDependencies,
): Promise<readonly ServiceEntrypointCheck[]> {
  const appsettingsPath = resolve(projectRoot, 'appsettings.json');
  if (!await dependencies.fs.exists(appsettingsPath)) {
    return [{
      check: check(
        SERVICE_ENTRYPOINT_RESOLVES_CHECK,
        SERVICE_ENTRYPOINT_RESOLVES_TITLE,
        'healthy',
        'No plugin service entrypoints are configured.',
      ),
    }];
  }

  let document: unknown;
  try {
    document = JSON.parse(await dependencies.fs.readFile(appsettingsPath));
  } catch (error) {
    return [{
      check: check(
        SERVICE_ENTRYPOINT_RESOLVES_CHECK,
        SERVICE_ENTRYPOINT_RESOLVES_TITLE,
        'error',
        `Could not read appsettings plugin entrypoints: ${errorMessage(error)}`,
      ),
    }];
  }
  const entries = readPluginEntries(document);
  if (entries.length === 0) {
    return [{
      check: check(
        SERVICE_ENTRYPOINT_RESOLVES_CHECK,
        SERVICE_ENTRYPOINT_RESOLVES_TITLE,
        'healthy',
        'No plugin service entrypoints are configured.',
      ),
    }];
  }

  return await Promise.all(entries.map(async (entry): Promise<ServiceEntrypointCheck> => ({
    pluginKey: entry.key,
    check: await checkServiceEntrypoint(projectRoot, entry, dependencies),
  })));
}

interface AppsettingsPluginEntrypoint {
  readonly key: string;
  readonly entrypoint: string;
  readonly workdir: string;
}

function readPluginEntries(value: unknown): readonly AppsettingsPluginEntrypoint[] {
  if (!value || typeof value !== 'object') return [];
  const netscript = Reflect.get(value, 'NetScript');
  if (!netscript || typeof netscript !== 'object') return [];
  const plugins = Reflect.get(netscript, 'Plugins');
  if (!plugins || typeof plugins !== 'object') return [];
  return Object.entries(plugins).flatMap(([key, entry]) => {
    if (!entry || typeof entry !== 'object') return [];
    const entrypoint = Reflect.get(entry, 'Entrypoint');
    const workdir = Reflect.get(entry, 'Workdir');
    return typeof entrypoint === 'string'
      ? [{ key, entrypoint, workdir: typeof workdir === 'string' ? workdir : '.' }]
      : [];
  });
}

async function checkServiceEntrypoint(
  projectRoot: string,
  entry: AppsettingsPluginEntrypoint,
  dependencies: PluginDoctorDependencies,
): Promise<PluginDoctorCheck> {
  const jsr = parseJsrEntrypoint(entry.entrypoint);
  if (jsr) {
    try {
      if (!dependencies.loadJsrExportMap) {
        throw new Error('JSR export-map loader is unavailable.');
      }
      const exports = await dependencies.loadJsrExportMap(jsr.packageSpecifier, jsr.version);
      const exists = exports.has(jsr.exportKey);
      return check(
        SERVICE_ENTRYPOINT_RESOLVES_CHECK,
        SERVICE_ENTRYPOINT_RESOLVES_TITLE,
        exists ? 'healthy' : 'error',
        exists
          ? entry.entrypoint
          : `${entry.entrypoint} is not declared in ${jsr.packageSpecifier}@${jsr.version}'s export map.`,
      );
    } catch (error) {
      if (error instanceof JsrExportMapHttpError && error.status === 404) {
        return check(
          SERVICE_ENTRYPOINT_RESOLVES_CHECK,
          SERVICE_ENTRYPOINT_RESOLVES_TITLE,
          'warning',
          `Excluded ${SERVICE_ENTRYPOINT_RESOLVES_CHECK} for ${jsr.packageSpecifier}@${jsr.version}: ` +
            'the exact pinned version is not published on JSR (HTTP 404). Rerun after publication.',
        );
      }
      return check(
        SERVICE_ENTRYPOINT_RESOLVES_CHECK,
        SERVICE_ENTRYPOINT_RESOLVES_TITLE,
        'error',
        `Could not verify ${entry.entrypoint}: ${errorMessage(error)}`,
      );
    }
  }

  const path = isAbsolute(entry.entrypoint)
    ? entry.entrypoint
    : resolve(projectRoot, entry.workdir, entry.entrypoint);
  const exists = await dependencies.fs.exists(path);
  return check(
    SERVICE_ENTRYPOINT_RESOLVES_CHECK,
    SERVICE_ENTRYPOINT_RESOLVES_TITLE,
    exists ? 'healthy' : 'error',
    exists ? entry.entrypoint : `${entry.entrypoint} does not exist at ${path}.`,
  );
}

function parseJsrEntrypoint(value: string): {
  readonly packageSpecifier: string;
  readonly version: string;
  readonly exportKey: string;
} | undefined {
  const match = /^jsr:(@[^/]+\/[^@/]+)@([^/]+)(\/.*)?$/.exec(value);
  if (!match) return undefined;
  return {
    packageSpecifier: match[1],
    version: match[2],
    exportKey: match[3] ? `.${match[3]}` : '.',
  };
}

function check(
  id: string,
  title: string,
  status: PluginDoctorCheckStatus,
  message: string,
): PluginDoctorCheck {
  return { id, title, status, message };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function workspaceChecksReport(checks: readonly ServiceEntrypointCheck[]): PluginDoctorReport {
  const flattened = checks.map((entry) => entry.check);
  return { pluginName: 'workspace', status: aggregateStatus(flattened), checks: flattened };
}

function isPluginDoctorReport(value: PluginDoctorReport | undefined): value is PluginDoctorReport {
  return value !== undefined;
}

async function checkAuthBackend(
  projectRoot: string,
  plugin: RegisteredPluginConfig,
  fs: FileSystemPort,
): Promise<readonly PluginDoctorCheck[]> {
  if (!plugin.cli?.doctorChecks?.includes('auth-backend')) return [];
  try {
    const backend = await showAuthBackend(projectRoot, fs);
    return [{
      id: 'auth-backend',
      title: 'Active auth backend',
      status: 'healthy',
      message: backend,
    }];
  } catch (error) {
    return [{
      id: 'auth-backend',
      title: 'Active auth backend',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    }];
  }
}

async function checkPluginSource(
  projectRoot: string,
  plugin: RegisteredPluginConfig,
  fs: FileSystemPort,
): Promise<readonly PluginDoctorCheck[]> {
  if (plugin.source.kind === 'package') {
    return [{
      id: 'source',
      title: 'Installation source',
      status: 'healthy',
      message: `Package-backed (${plugin.source.configuredSpecifier}); no local workdir required`,
    }];
  }
  const workdir = resolve(projectRoot, plugin.source.workdir);
  const exists = await fs.exists(workdir);
  return [{
    id: 'workdir',
    title: 'Workspace directory',
    status: exists ? 'healthy' : 'warning',
    message: exists ? plugin.source.workdir : `${plugin.source.workdir} does not exist`,
  }];
}

async function checkPermissions(
  projectRoot: string,
  plugin: RegisteredPluginConfig,
  fs: FileSystemPort,
): Promise<PluginDoctorCheck> {
  const appsettings = await readPermissionSettings(projectRoot, fs);
  const localName = pluginLocalName(plugin.name);
  const configured = appsettings.plugins.get(localName) ??
    [...appsettings.plugins.entries()].find(([name]) =>
      getPluginServiceLookupName(name) === localName
    )?.[1] ?? appsettings.background.get(localName);
  const permissions = resolveEffectivePluginPermissions(
    configured,
    plugin.service?.permissions,
    plugin.permissions,
    appsettings.defaults,
  );
  const published = resolveEffectivePluginPermissions(
    undefined,
    plugin.service?.permissions,
    plugin.permissions,
    appsettings.defaults,
  );
  if (configured && !samePermissions(permissions, published)) {
    return {
      id: 'permissions',
      title: 'Permission metadata',
      status: 'warning',
      message: `${permissions.join(' ')} (explicit override differs from published default: ${
        published.join(' ')
      })`,
    };
  }
  return {
    id: 'permissions',
    title: 'Permission metadata',
    status: permissions.length > 0 ? 'healthy' : 'warning',
    message: permissions.length > 0 ? permissions.join(' ') : 'No plugin permissions declared',
  };
}

interface PermissionSettings {
  readonly defaults: readonly string[];
  readonly plugins: ReadonlyMap<string, readonly string[]>;
  readonly background: ReadonlyMap<string, readonly string[]>;
}

async function readPermissionSettings(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<PermissionSettings> {
  const empty: PermissionSettings = { defaults: [], plugins: new Map(), background: new Map() };
  const path = resolve(projectRoot, 'appsettings.json');
  if (!await fs.exists(path)) return empty;
  try {
    const document: unknown = JSON.parse(await fs.readFile(path));
    if (!isRecord(document) || !isRecord(document.NetScript)) return empty;
    const defaults = isRecord(document.NetScript.Defaults) &&
        isRecord(document.NetScript.Defaults.Deno)
      ? stringArray(document.NetScript.Defaults.Deno.Permissions) ?? []
      : [];
    return {
      defaults,
      plugins: permissionEntries(document.NetScript.Plugins),
      background: permissionEntries(document.NetScript.BackgroundProcessors),
    };
  } catch {
    return empty;
  }
}

function permissionEntries(value: unknown): ReadonlyMap<string, readonly string[]> {
  if (!isRecord(value)) return new Map();
  return new Map(
    Object.entries(value).flatMap(([name, entry]) => {
      if (!isRecord(entry)) return [];
      const permissions = stringArray(entry.Permissions);
      return permissions ? [[name, permissions] as const] : [];
    }),
  );
}

function stringArray(value: unknown): readonly string[] | undefined {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
    ? value
    : undefined;
}

function samePermissions(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((permission, index) => permission === right[index]);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function aggregateStatus(checks: readonly PluginDoctorCheck[]): PluginDoctorCheckStatus {
  if (checks.some((check) => check.status === 'error')) return 'error';
  if (checks.some((check) => check.status === 'warning')) return 'warning';
  return 'healthy';
}

async function checkPluginDoctor(
  projectRoot: string,
  plugin: RegisteredPluginConfig,
  fs: FileSystemPort,
): Promise<readonly PluginDoctorCheck[]> {
  if (!plugin.doctor) return [];
  try {
    const moduleUrl = isModuleSpecifier(plugin.doctor) || plugin.source.kind === 'package'
      ? plugin.doctor
      : toFileUrl(resolve(plugin.source.rootDir, plugin.doctor)).href;
    const module = await import(moduleUrl) as Record<string, unknown>;
    const adapter = Object.values(module).find((value): value is NetScriptPlugin =>
      isNetScriptPlugin(value) && pluginLocalName(value.name) === pluginLocalName(plugin.name)
    );
    if (!adapter) {
      throw new Error(`Doctor module ${plugin.doctor} exports no matching NetScriptPlugin.`);
    }

    const context: PluginCommandContext = {
      workspaceRoot: projectRoot,
      options: {},
      config: {},
      dryRun: true,
      fileSystem: {
        readText: (path) => fs.readFile(resolve(projectRoot, path)),
        writeText: () => Promise.reject(new Error('Doctor checks are read-only.')),
        exists: (path) => fs.exists(resolve(projectRoot, path)),
      },
    };
    const checks: DoctorReport['checks'][number][] = [];
    for (const check of adapter.doctor?.extraChecks ?? []) {
      checks.push(await check.run(context));
    }
    return checks.map((check, index) => ({
      id: `plugin:${index}:${check.name}`,
      title: check.name,
      status: check.ok ? 'healthy' : 'error',
      message: check.message,
    }));
  } catch (error) {
    return [{
      id: 'plugin-doctor-import',
      title: 'Plugin doctor contribution',
      status: 'error',
      message: `${
        error instanceof Error ? error.message : String(error)
      } Run: netscript plugin sync`,
    }];
  }
}

function pluginLocalName(value: string): string {
  const segment = value.split('/').at(-1) ?? value;
  return segment.startsWith('plugin-') ? segment.slice('plugin-'.length) : segment;
}

function isModuleSpecifier(value: string): boolean {
  return /^(?:file|jsr|https?):/.test(value);
}

function isNetScriptPlugin(value: unknown): value is NetScriptPlugin {
  if (!value || typeof value !== 'object') return false;
  return typeof Reflect.get(value, 'name') === 'string' &&
    typeof Reflect.get(value, 'kind') === 'string' &&
    typeof Reflect.get(value, 'displayName') === 'string';
}

function resolvePluginSpecs(config: NetScriptConfig): readonly string[] {
  return config.plugins;
}

function workspaceErrorReport(
  id: string,
  title: string,
  error: unknown,
): PluginDoctorReport {
  return {
    pluginName: 'workspace',
    status: 'error',
    checks: [{
      id,
      title,
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    }],
  };
}

function configErrorReports(error: unknown): readonly PluginDoctorReport[] {
  const issues = readValidationIssues(error);
  if (issues.length === 0) {
    return [workspaceErrorReport('config-load', 'Could not load netscript.config.ts.', error)];
  }
  return [{
    pluginName: 'workspace',
    status: 'error',
    checks: issues.map((issue, index) => ({
      id: `config:${index}:${issue.path}`,
      title: `Config field ${issue.path || '<root>'}`,
      status: 'error',
      message: `${issue.message} Fix netscript.config.ts and rerun: netscript plugin doctor`,
    })),
  }];
}

function readValidationIssues(
  error: unknown,
): readonly { readonly path: string; readonly message: string }[] {
  if (!error || typeof error !== 'object') return [];
  const rawIssues = Reflect.get(error, 'issues');
  if (!Array.isArray(rawIssues)) return [];
  return rawIssues.flatMap((issue) => {
    if (!issue || typeof issue !== 'object') return [];
    const path = Reflect.get(issue, 'path');
    const message = Reflect.get(issue, 'message');
    if (!Array.isArray(path) || typeof message !== 'string') return [];
    return [{ path: path.map(String).join('.'), message }];
  });
}
