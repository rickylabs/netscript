import { resolve } from '@std/path';
import { toFileUrl } from '@std/path/to-file-url';
import type { NetScriptConfig } from '@netscript/config';
import type {
  DoctorReport,
  NetScriptPlugin,
  PluginCommandContext,
} from '@netscript/plugin/adapter';

import type { RegisteredPluginConfig } from '../../../../kernel/domain/resolved-config.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { loadRegisteredPluginMetadata } from '../../../../kernel/adapters/config/plugin-registry.ts';
import { showAuthBackend } from '../auth/auth-config.ts';

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
  /** Inspect the running Aspire AppHost for configured resource truth. */
  readonly inspectAppHost?: AppHostInspector;
}

/** One named resource observed from a running AppHost. */
export interface AppHostResourceState {
  readonly name: string;
  readonly state?: string;
  readonly healthStatus?: string;
}

/** Explicit AppHost lifecycle and resource snapshot. */
export type AppHostInspection =
  | { readonly status: 'not-running' }
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
  const appHostReport = dependencies.inspectAppHost
    ? await diagnoseAppHost(input.projectRoot, config, dependencies.inspectAppHost)
    : undefined;
  if (pluginSpecs.length === 0) return appHostReport ? [appHostReport] : [];

  let plugins: Record<string, RegisteredPluginConfig>;
  try {
    plugins = dependencies.loadRegisteredPlugins
      ? await dependencies.loadRegisteredPlugins(input.projectRoot, config)
      : await loadRegisteredPluginMetadata(input.projectRoot, config);
  } catch (error) {
    return [workspaceErrorReport('manifest-resolution', 'Could not resolve plugin manifests.', error)];
  }

  const reports = await Promise.all(
    Object.values(plugins).map((plugin) => diagnosePlugin(input.projectRoot, plugin, dependencies)),
  );
  return appHostReport ? [appHostReport, ...reports] : reports;
}

async function diagnoseAppHost(
  projectRoot: string,
  config: NetScriptConfig,
  inspector: AppHostInspector,
): Promise<PluginDoctorReport> {
  try {
    const snapshot = await inspector.inspect(projectRoot);
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
      const healthy = resource.state?.toLowerCase() === 'running' &&
        resource.healthStatus?.toLowerCase() === 'healthy';
      return {
        id: `apphost:resource:${name}`,
        title: `AppHost resource ${name}`,
        status: healthy ? 'healthy' : 'error',
        message: healthy
          ? 'Running and healthy'
          : `Resource "${name}" is ${resource.state ?? 'unknown'} / ${resource.healthStatus ?? 'unknown'}.`,
      };
    });
    return { pluginName: 'apphost', status: aggregateStatus(checks), checks };
  } catch (error) {
    return workspaceErrorReport('apphost:inspection', 'Could not inspect Aspire AppHost.', error);
  }
}

function configuredResourceNames(config: NetScriptConfig): readonly string[] {
  return [...new Set([
    ...Object.keys(config.services ?? {}),
    ...Object.keys(config.apps ?? {}),
    ...Object.keys(config.databases ?? {}),
  ])].sort();
}

async function diagnosePlugin(
  projectRoot: string,
  plugin: RegisteredPluginConfig,
  dependencies: PluginDoctorDependencies,
): Promise<PluginDoctorReport> {
  if (plugin.manifestError) {
    const checks: PluginDoctorCheck[] = [{
      id: 'manifest-resolution',
      title: 'Manifest resolved',
      status: 'error',
      message: `${plugin.manifestError} Run: netscript plugin sync`,
    }];
    return { pluginName: plugin.name, status: 'error', checks };
  }

  const checks: PluginDoctorCheck[] = [
    {
      id: 'manifest',
      title: 'Manifest resolved',
      status: 'healthy',
      message: plugin.displayName ?? plugin.name,
    },
    await checkWorkdir(projectRoot, plugin, dependencies.fs),
    checkPermissions(plugin),
    ...await checkAuthBackend(projectRoot, plugin, dependencies.fs),
    ...await checkPluginDoctor(projectRoot, plugin, dependencies.fs),
  ];

  return {
    pluginName: plugin.name,
    status: aggregateStatus(checks),
    checks,
  };
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

async function checkWorkdir(
  projectRoot: string,
  plugin: RegisteredPluginConfig,
  fs: FileSystemPort,
): Promise<PluginDoctorCheck> {
  const workdir = resolve(projectRoot, plugin.workdir);
  const exists = await fs.exists(workdir);
  return {
    id: 'workdir',
    title: 'Workspace directory',
    status: exists ? 'healthy' : 'warning',
    message: exists ? plugin.workdir : `${plugin.workdir} does not exist`,
  };
}

function checkPermissions(plugin: RegisteredPluginConfig): PluginDoctorCheck {
  const permissions = plugin.permissions ?? [];
  return {
    id: 'permissions',
    title: 'Permission metadata',
    status: permissions.length > 0 ? 'healthy' : 'warning',
    message: permissions.length > 0 ? permissions.join(' ') : 'No plugin permissions declared',
  };
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
    const moduleUrl = isModuleSpecifier(plugin.doctor)
      ? plugin.doctor
      : toFileUrl(resolve(plugin.rootDir, plugin.doctor)).href;
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
      message: `${error instanceof Error ? error.message : String(error)} Run: netscript plugin sync`,
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
  return (config as NetScriptConfig & { readonly plugins?: readonly string[] }).plugins ?? [];
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
