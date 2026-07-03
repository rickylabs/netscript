/**
 * @module deploy/runtime-detect
 *
 * OS routing for bare-metal deploy. Detects the target service OS and builds
 * the OS-appropriate service/unit name and config-file path. Pure kernel logic
 * (no port/adapter dependency) shared by the install/uninstall flows and the
 * lifecycle commands so naming stays consistent across the Windows (servy) and
 * Linux (systemd) lanes.
 */

import { join } from '@std/path';
import { fullServiceName } from './commands/servy-command.ts';
import { fullUnitName } from '../linux/systemd/systemd-command.ts';

/** Supported bare-metal deploy service operating systems. */
export type ServiceOs = 'windows' | 'linux';

/**
 * Resolve the service OS. An explicit value wins; otherwise map the host:
 * Windows → `windows`, everything else → `linux` (the only other supported
 * bare-metal lane).
 */
export function detectServiceOs(explicit?: ServiceOs): ServiceOs {
  if (explicit) {
    return explicit;
  }
  return Deno.build.os === 'windows' ? 'windows' : 'linux';
}

/**
 * Build the full OS service/unit name from a short service name:
 * Windows → `<prefix>.<name>` (servy); Linux → `<prefix>-<name>.service` (systemd).
 */
export function fullServiceNameForOs(
  os: ServiceOs,
  shortName: string,
  options: { readonly prefix?: string } = {},
): string {
  return os === 'windows'
    ? fullServiceName(shortName, options.prefix)
    : fullUnitName(shortName, options.prefix);
}

/**
 * Config file name for a service on the target OS: Windows → `<name>.xml`
 * (servy config); Linux → `<name>.service` (systemd unit).
 */
export function serviceConfigFileName(os: ServiceOs, shortName: string): string {
  return os === 'windows' ? `${shortName}.xml` : `${shortName}.service`;
}

/** Full config-file path for a service within a config directory. */
export function serviceConfigPath(
  os: ServiceOs,
  configDir: string,
  shortName: string,
): string {
  return join(configDir, serviceConfigFileName(os, shortName));
}
