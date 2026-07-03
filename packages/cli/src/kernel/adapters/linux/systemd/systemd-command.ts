/**
 * @module linux/systemd/systemd-command
 *
 * systemctl / journalctl argument builders — the single source of truth for
 * systemd invocations, the Linux analogue of `deploy/commands/servy-command.ts`.
 * Keeping arg construction here lets the adapter and any command-layer caller
 * emit byte-identical systemctl calls.
 */

import { DEFAULT_LINUX_UNIT_PREFIX } from '../../../constants/linux.ts';

/** Build the full systemd unit name from a short service name. */
export function fullUnitName(
  shortName: string,
  prefix: string = DEFAULT_LINUX_UNIT_PREFIX,
): string {
  return `${prefix}-${shortName}.service`;
}

/** Build `systemctl` args for a lifecycle command. */
export function systemctlLifecycleArgs(
  command: 'start' | 'stop' | 'status',
  unitName: string,
): string[] {
  return [command, unitName];
}

/**
 * Build `systemctl enable` args to register a unit.
 *
 * Structurally typed to avoid a kernel→public import of
 * `OsServiceInstallRequest`. `enable` on an absolute unit path links the unit
 * into the systemd search path; `--force` overwrites an existing symlink.
 */
export function systemctlEnableArgs(
  request: { serviceName: string; configPath: string; force: boolean },
): string[] {
  const args = ['enable'];
  if (request.force) {
    args.push('--force');
  }
  args.push(request.configPath);
  return args;
}

/** Build `systemctl disable` args to deregister a unit (uninstall). */
export function systemctlDisableArgs(unitName: string): string[] {
  return ['disable', unitName];
}

/** Build `systemctl daemon-reload` args. */
export function systemctlDaemonReloadArgs(): string[] {
  return ['daemon-reload'];
}

/** Build `journalctl` args to read a unit's logs. */
export function journalctlLogsArgs(
  unitName: string,
  options: { readonly lines?: number; readonly follow?: boolean } = {},
): string[] {
  const args = ['-u', unitName];
  if (typeof options.lines === 'number') {
    args.push('-n', String(options.lines));
  }
  if (options.follow) {
    args.push('-f');
  }
  return args;
}
