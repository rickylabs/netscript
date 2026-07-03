/**
 * @module linux/systemd/systemd-unit
 *
 * Render a systemd `.service` unit file from a `SystemdUnitConfig`. The Linux
 * bare-metal analogue of `adapters/windows/servy/servy-xml.ts`: each service
 * gets one `.service` unit that systemd loads.
 */

import {
  DEFAULT_SYSTEMD_RESTART,
  DEFAULT_SYSTEMD_RESTART_SEC,
  DEFAULT_SYSTEMD_SERVICE_TYPE,
  DEFAULT_SYSTEMD_START_TIMEOUT_SEC,
  DEFAULT_SYSTEMD_STOP_TIMEOUT_SEC,
  DEFAULT_SYSTEMD_WANTED_BY,
} from '../../../constants/linux.ts';

/** Declarative inputs for a single systemd service unit. */
export interface SystemdUnitConfig {
  /** Human-readable `[Unit] Description=`. */
  readonly description: string;

  /** Absolute `ExecStart=` command line (binary + args, already quoted as needed). */
  readonly execStart: string;

  /** `WorkingDirectory=`. */
  readonly workingDirectory: string;

  /** Optional service `User=`. Omitted → runs as root (`RunAsLocalSystem` parity). */
  readonly user?: string;

  /** Optional service `Group=`. */
  readonly group?: string;

  /** `Environment=` key/value pairs. */
  readonly environment: Record<string, string>;

  /** `[Unit] After=` ordering dependencies. */
  readonly after: readonly string[];

  /** `[Unit] Wants=` weak dependencies. */
  readonly wants: readonly string[];

  /** `[Install] WantedBy=` target. Defaults to `multi-user.target`. */
  readonly wantedBy?: string;

  /** `[Service] Type=`. Defaults to `simple`. */
  readonly serviceType?: string;

  /** `[Service] Restart=` policy. Defaults to `on-failure`. */
  readonly restart?: string;

  /** `[Service] RestartSec=` seconds. */
  readonly restartSec?: number;

  /** `[Service] TimeoutStartSec=` seconds. */
  readonly startTimeoutSec?: number;

  /** `[Service] TimeoutStopSec=` seconds. */
  readonly stopTimeoutSec?: number;

  /** Relative `RuntimeDirectory=` name (systemd creates it under `/run`). */
  readonly runtimeDirectory?: string;

  /** Optional health-check URL, emitted as a comment for operator reference. */
  readonly healthCheckUrl?: string;
}

/**
 * Escape a value for a systemd `Environment="KEY=value"` assignment.
 *
 * systemd's env parser treats `"` as a quote delimiter and `\` as an escape;
 * newlines would break the single-line directive.
 */
function escapeEnvValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ');
}

/** Render a systemd `.service` unit file from a `SystemdUnitConfig`. */
export function renderSystemdUnit(config: SystemdUnitConfig): string {
  const serviceType = config.serviceType ?? DEFAULT_SYSTEMD_SERVICE_TYPE;
  const restart = config.restart ?? DEFAULT_SYSTEMD_RESTART;
  const restartSec = config.restartSec ?? DEFAULT_SYSTEMD_RESTART_SEC;
  const startTimeout = config.startTimeoutSec ?? DEFAULT_SYSTEMD_START_TIMEOUT_SEC;
  const stopTimeout = config.stopTimeoutSec ?? DEFAULT_SYSTEMD_STOP_TIMEOUT_SEC;
  const wantedBy = config.wantedBy ?? DEFAULT_SYSTEMD_WANTED_BY;

  const lines: string[] = ['[Unit]', `Description=${config.description}`];

  if (config.after.length > 0) {
    lines.push(`After=${config.after.join(' ')}`);
  }
  if (config.wants.length > 0) {
    lines.push(`Wants=${config.wants.join(' ')}`);
  }
  if (config.healthCheckUrl) {
    lines.push(`# health: ${config.healthCheckUrl}`);
  }

  lines.push(
    '',
    '[Service]',
    `Type=${serviceType}`,
    `ExecStart=${config.execStart}`,
    `WorkingDirectory=${config.workingDirectory}`,
  );

  if (config.user) {
    lines.push(`User=${config.user}`);
  }
  if (config.group) {
    lines.push(`Group=${config.group}`);
  }

  for (const [key, value] of Object.entries(config.environment)) {
    lines.push(`Environment="${key}=${escapeEnvValue(value)}"`);
  }

  if (config.runtimeDirectory) {
    lines.push(`RuntimeDirectory=${config.runtimeDirectory}`);
  }

  lines.push(
    `Restart=${restart}`,
    `RestartSec=${restartSec}`,
    `TimeoutStartSec=${startTimeout}`,
    `TimeoutStopSec=${stopTimeout}`,
    'StandardOutput=journal',
    'StandardError=journal',
    '',
    '[Install]',
    `WantedBy=${wantedBy}`,
    '',
  );

  return lines.join('\n');
}
