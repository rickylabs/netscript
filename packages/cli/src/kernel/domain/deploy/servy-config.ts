/**
 * @module types/servy
 * Servy Windows Service configuration types.
 * @see https://github.com/aelassas/servy
 */

/**
 * Servy startup type strings (mapped to integer values in XML generation).
 */
export type ServyStartupType = 'Automatic' | 'AutomaticDelayedStart' | 'Manual' | 'Disabled';

/**
 * Servy process priority strings (mapped to integer values in XML generation).
 */
export type ServyPriority = 'Idle' | 'BelowNormal' | 'Normal' | 'AboveNormal' | 'High' | 'RealTime';

/**
 * Log rotation schedule strings (mapped to integer values in XML generation).
 */
export type ServyDateRotationType = 'Daily' | 'Weekly' | 'Monthly';

/**
 * Service recovery action strings (mapped to integer values in XML generation).
 */
export type ServyRecoveryAction = 'None' | 'RestartService' | 'RestartProcess' | 'RestartComputer';

/**
 * Complete Servy service configuration.
 * Generated from NetScript config and written to a .xml file per service.
 */
export interface ServyServiceConfig {
  // Identity
  name: string;
  displayName?: string;
  description: string;

  // Executable
  executablePath: string;
  startupDirectory: string;
  parameters?: string;

  // Startup behavior
  startupType: ServyStartupType;
  priority: ServyPriority;

  // Environment variables injected into the service process
  environmentVariables: Record<string, string>;

  // Log settings
  stdoutPath: string;
  stderrPath: string;
  enableSizeRotation: boolean;
  rotationSizeMB: number;
  enableDateRotation: boolean;
  dateRotationType: ServyDateRotationType;
  maxRotations: number;

  // Health monitoring
  enableHealthMonitoring: boolean;
  healthCheckUrl?: string;
  heartbeatIntervalSeconds: number;
  maxFailedChecks: number;

  // Failure recovery
  recoveryAction: ServyRecoveryAction;
  maxRestartAttempts: number;

  // Windows Service dependencies (other Windows Service names)
  serviceDependencies?: string[];

  // User account
  runAsLocalSystem: boolean;
  userAccount?: string;
  password?: string;

  // Pre/post launch hooks
  preLaunchPath?: string;
  preLaunchParameters?: string;
  preLaunchTimeout?: number;
  postLaunchPath?: string;
  postLaunchParameters?: string;
}
