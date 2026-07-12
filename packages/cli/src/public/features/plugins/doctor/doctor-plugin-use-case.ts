import { resolve } from '@std/path';
import type { NetScriptConfig } from '@netscript/config';

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
    return [workspaceErrorReport('config-load', 'Could not load netscript.config.ts.', error)];
  }

  const pluginSpecs = resolvePluginSpecs(config);
  if (pluginSpecs.length === 0) return [];

  let plugins: Record<string, RegisteredPluginConfig>;
  try {
    const loadPlugins = dependencies.loadRegisteredPlugins ?? loadRegisteredPluginMetadata;
    plugins = await loadPlugins(input.projectRoot, config);
  } catch (error) {
    return [workspaceErrorReport('manifest-resolution', 'Could not resolve plugin manifests.', error)];
  }

  return await Promise.all(
    Object.values(plugins).map((plugin) => diagnosePlugin(input.projectRoot, plugin, dependencies)),
  );
}

async function diagnosePlugin(
  projectRoot: string,
  plugin: RegisteredPluginConfig,
  dependencies: PluginDoctorDependencies,
): Promise<PluginDoctorReport> {
  const checks: PluginDoctorCheck[] = [
    {
      id: 'manifest',
      title: 'Manifest resolved',
      status: 'healthy',
      message: plugin.displayName ?? plugin.name,
    },
    await checkWorkdir(projectRoot, plugin, dependencies.fs),
    checkPermissions(plugin),
    checkRuntimeConfig(plugin),
    ...await checkAuthBackend(projectRoot, plugin, dependencies.fs),
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

function checkRuntimeConfig(plugin: RegisteredPluginConfig): PluginDoctorCheck {
  return {
    id: 'runtime-config',
    title: 'Runtime config contribution',
    status: plugin.runtimeConfig ? 'healthy' : 'healthy',
    message: plugin.runtimeConfig ? 'Runtime config topic declared' : 'No runtime config topic',
  };
}

function aggregateStatus(checks: readonly PluginDoctorCheck[]): PluginDoctorCheckStatus {
  if (checks.some((check) => check.status === 'error')) return 'error';
  if (checks.some((check) => check.status === 'warning')) return 'warning';
  return 'healthy';
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
