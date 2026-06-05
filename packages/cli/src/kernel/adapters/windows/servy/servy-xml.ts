/** Generate Servy XML service definitions. */
import {
  SERVY_DATE_ROTATION_TYPE,
  SERVY_PRIORITY,
  SERVY_RECOVERY_ACTION,
  SERVY_STARTUP_TYPE,
} from '../../../constants/windows.ts';
import type { ServyServiceConfig } from '../../../domain/deploy/servy-config.ts';

// ============================================================================
// XML GENERATION
// ============================================================================

/**
 * Escape XML special characters in a string value.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format environment variables as Servy's semicolon-delimited key=value string.
 * Special characters in values are left as-is (Servy handles them).
 */
function formatEnvVars(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}=${v}`)
    .join(';');
}

/**
 * Generate Servy XML from a ServyServiceConfig.
 * Each service gets one .xml file that Servy imports.
 */
export function generateServyXml(config: ServyServiceConfig): string {
  const startupType = SERVY_STARTUP_TYPE[config.startupType] ?? SERVY_STARTUP_TYPE.Automatic;
  const priority = SERVY_PRIORITY[config.priority] ?? SERVY_PRIORITY.Normal;
  const dateRotation = SERVY_DATE_ROTATION_TYPE[config.dateRotationType] ??
    SERVY_DATE_ROTATION_TYPE.Daily;
  const recovery = SERVY_RECOVERY_ACTION[config.recoveryAction] ??
    SERVY_RECOVERY_ACTION.RestartService;

  const envVarString = formatEnvVars(config.environmentVariables);
  const deps = config.serviceDependencies?.join(';') ?? '';

  const lines: string[] = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<ServiceDto>',
    `  <Name>${escapeXml(config.name)}</Name>`,
  ];

  if (config.displayName) {
    lines.push(`  <DisplayName>${escapeXml(config.displayName)}</DisplayName>`);
  }

  lines.push(
    `  <Description>${escapeXml(config.description)}</Description>`,
    `  <ExecutablePath>${escapeXml(config.executablePath)}</ExecutablePath>`,
    `  <StartupDirectory>${escapeXml(config.startupDirectory)}</StartupDirectory>`,
  );

  if (config.parameters) {
    lines.push(`  <Parameters>${escapeXml(config.parameters)}</Parameters>`);
  }

  lines.push(
    `  <StartupType>${startupType}</StartupType>`,
    `  <Priority>${priority}</Priority>`,
    `  <StdoutPath>${escapeXml(config.stdoutPath)}</StdoutPath>`,
    `  <StderrPath>${escapeXml(config.stderrPath)}</StderrPath>`,
    `  <StartTimeout>30</StartTimeout>`,
    `  <StopTimeout>30</StopTimeout>`,
    `  <EnableRotation>${config.enableSizeRotation}</EnableRotation>`,
    `  <RotationSize>${config.rotationSizeMB}</RotationSize>`,
    `  <EnableDateRotation>${config.enableDateRotation}</EnableDateRotation>`,
    `  <DateRotationType>${dateRotation}</DateRotationType>`,
    `  <MaxRotations>${config.maxRotations}</MaxRotations>`,
    `  <EnableDebugLogs>false</EnableDebugLogs>`,
    `  <EnableHealthMonitoring>${config.enableHealthMonitoring}</EnableHealthMonitoring>`,
  );

  if (config.healthCheckUrl) {
    lines.push(`  <!-- health: ${escapeXml(config.healthCheckUrl)} -->`);
  }

  lines.push(
    `  <HeartbeatInterval>${config.heartbeatIntervalSeconds}</HeartbeatInterval>`,
    `  <MaxFailedChecks>${config.maxFailedChecks}</MaxFailedChecks>`,
    `  <RecoveryAction>${recovery}</RecoveryAction>`,
    `  <MaxRestartAttempts>${config.maxRestartAttempts}</MaxRestartAttempts>`,
  );

  if (envVarString) {
    lines.push(`  <EnvironmentVariables>${escapeXml(envVarString)}</EnvironmentVariables>`);
  }

  if (deps) {
    lines.push(`  <ServiceDependencies>${escapeXml(deps)}</ServiceDependencies>`);
  }

  lines.push(`  <RunAsLocalSystem>${config.runAsLocalSystem}</RunAsLocalSystem>`);

  if (config.userAccount) {
    lines.push(`  <UserAccount>${escapeXml(config.userAccount)}</UserAccount>`);
    if (config.password) {
      lines.push(`  <Password>${escapeXml(config.password)}</Password>`);
    }
  }

  if (config.preLaunchPath) {
    lines.push(
      `  <PreLaunchExecutablePath>${escapeXml(config.preLaunchPath)}</PreLaunchExecutablePath>`,
    );
    if (config.preLaunchParameters) {
      lines.push(
        `  <PreLaunchParameters>${escapeXml(config.preLaunchParameters)}</PreLaunchParameters>`,
      );
    }
    if (config.preLaunchTimeout) {
      lines.push(`  <PreLaunchTimeoutSeconds>${config.preLaunchTimeout}</PreLaunchTimeoutSeconds>`);
    }
    lines.push(`  <PreLaunchIgnoreFailure>false</PreLaunchIgnoreFailure>`);
  }

  if (config.postLaunchPath) {
    lines.push(
      `  <PostLaunchExecutablePath>${escapeXml(config.postLaunchPath)}</PostLaunchExecutablePath>`,
    );
    if (config.postLaunchParameters) {
      lines.push(
        `  <PostLaunchParameters>${escapeXml(config.postLaunchParameters)}</PostLaunchParameters>`,
      );
    }
  }

  lines.push('</ServiceDto>');
  return lines.join('\n');
}
