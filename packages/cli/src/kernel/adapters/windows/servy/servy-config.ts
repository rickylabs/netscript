/** Build Servy service config objects from compile targets. */
import { join } from '@std/path';
import {
  DEFAULT_HEALTH_MONITORING,
  DEFAULT_LOG_ROTATION,
  DEFAULT_SERVICE_PREFIX,
} from '../../../constants/windows.ts';
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';
import type { InfrastructureConfig } from '../../../domain/infrastructure-config.ts';
import type { ServyServiceConfig } from '../../../domain/deploy/servy-config.ts';
import type { ManifestContext } from '../manifest/manifest-resolver.ts';
import { buildServiceEnvironment } from './servy-environment.ts';

// ============================================================================
// CONFIG BUILDER
// ============================================================================

/**
 * Options for building Servy service configuration.
 */
export interface BuildServyConfigOptions {
  /** Absolute installation directory (e.g., C:\NetScript\test-app) */
  installDir: string;
  /** All compile targets (for service discovery env vars) */
  allTargets: CompileTarget[];
  /** Resolved infrastructure configuration */
  infrastructure: InfrastructureConfig;
  /** Raw connection strings from appsettings.json */
  connectionStrings: Record<string, string>;
  /** Project root to embed in binaries */
  projectRoot: string;
  /** Application version to inject as NETSCRIPT_VERSION env var */
  version?: string;
  /** Pre-built Aspire manifest context for dynamic env var resolution (optional) */
  manifestCtx?: ManifestContext | null;
}

/**
 * Build a complete ServyServiceConfig for a compile target.
 * Uses constants for all defaults — no magic values.
 */
export function buildServyConfig(
  target: CompileTarget,
  options: BuildServyConfigOptions,
): ServyServiceConfig {
  const serviceName = `${DEFAULT_SERVICE_PREFIX}.${target.name}`;
  const binDir = join(options.installDir, 'bin');
  const logsDir = join(options.installDir, 'logs');

  const environment = buildServiceEnvironment(
    target,
    options.allTargets,
    options.infrastructure,
    options.installDir,
    options.connectionStrings,
    options.projectRoot,
    options.version,
    options.manifestCtx,
  );

  const windowsBinDir = binDir.replace(/\//g, '\\');
  const windowsLogsDir = logsDir.replace(/\//g, '\\');

  // Workers and plugins benefit from delayed start: system services (DB, cache)
  // stabilise first, then the background processors start.
  const startupType = (target.type === 'worker' || target.type === 'plugin')
    ? 'AutomaticDelayedStart'
    : 'Automatic';

  // Workers run at BelowNormal priority so they don't compete with service
  // request handlers during peak traffic.
  const priority = target.type === 'worker' ? 'BelowNormal' : 'Normal';

  return {
    name: serviceName,
    displayName: `NetScript ${target.name} Service`,
    description: target.description ?? `NetScript ${target.name} service`,

    executablePath: `${windowsBinDir}\\${target.name}.exe`,
    startupDirectory: windowsBinDir,

    startupType,
    priority,

    environmentVariables: environment,

    stdoutPath: `${windowsLogsDir}\\${target.name}.log`,
    stderrPath: `${windowsLogsDir}\\${target.name}-error.log`,
    enableSizeRotation: DEFAULT_LOG_ROTATION.enableSizeRotation,
    rotationSizeMB: DEFAULT_LOG_ROTATION.rotationSizeMB,
    enableDateRotation: DEFAULT_LOG_ROTATION.enableDateRotation,
    dateRotationType: DEFAULT_LOG_ROTATION.dateRotationType,
    maxRotations: DEFAULT_LOG_ROTATION.maxRotations,

    enableHealthMonitoring: DEFAULT_HEALTH_MONITORING.enableHealthMonitoring,
    healthCheckUrl: target.port ? `http://localhost:${target.port}/health` : undefined,
    heartbeatIntervalSeconds: DEFAULT_HEALTH_MONITORING.heartbeatIntervalSeconds,
    maxFailedChecks: DEFAULT_HEALTH_MONITORING.maxFailedChecks,

    recoveryAction: DEFAULT_HEALTH_MONITORING.recoveryAction,
    maxRestartAttempts: DEFAULT_HEALTH_MONITORING.maxRestartAttempts,

    serviceDependencies: target.dependsOn?.map((dep) => `${DEFAULT_SERVICE_PREFIX}.${dep}`),

    // Service account: if SERVY_SERVICE_ACCOUNT is set at build time, run the
    // service under that domain account instead of Local System.
    // Normalize double-backslash (\\) to single (\) — .env files store
    // DOMAIN\\user but servy-cli expects DOMAIN\user.
    ...(Deno.env.get('SERVY_SERVICE_ACCOUNT')
      ? {
        runAsLocalSystem: false,
        userAccount: Deno.env.get('SERVY_SERVICE_ACCOUNT')!.replace(/\\\\/g, '\\'),
        password: Deno.env.get('SERVY_SERVICE_PASSWORD'),
      }
      : { runAsLocalSystem: true }),
  };
}
