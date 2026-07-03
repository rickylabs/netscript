import { outputText } from '../../../presentation/output/default-output.ts';
/**
 * @module commands/deploy/servy-command
 *
 * Servy CLI helpers for deploy commands.
 */

import { exists } from '@std/fs';
import { gray } from '@std/fmt/colors';
import { DEFAULT_SERVICE_PREFIX, DEFAULT_SERVY_CLI_PATH } from '../../../constants/windows.ts';
import type { ServyResult } from '../types.ts';

/**
 * Run a single servy-cli.exe command and capture its output.
 */
export async function runServy(
  servyCliPath: string,
  args: string[],
  verbose: boolean,
): Promise<ServyResult> {
  if (verbose) {
    const quotedArgs = args
      .map((a) => (a.includes(' ') ? `"${a}"` : a))
      .join(' ');
    outputText(gray(`    Cmd: "${servyCliPath}" ${quotedArgs}`));
  }

  const cmd = new Deno.Command(servyCliPath, {
    args,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  });

  const result = await cmd.output();
  const outText = new TextDecoder().decode(result.stdout).trim();
  const errText = new TextDecoder().decode(result.stderr).trim();
  const message = outText ||
    errText ||
    (result.success ? 'OK' : 'servy-cli exited non-zero (no output captured)');

  if (verbose && message && message !== 'OK') {
    outputText(gray(`    Output: ${message}`));
  }

  return { success: result.success, message, code: result.code };
}

/** Build standard servy-cli args for a lifecycle command. */
export function servyLifecycleArgs(
  command: 'start' | 'stop' | 'status' | 'uninstall',
  fullServiceName: string,
): string[] {
  return [command, '-n', fullServiceName, '-q'];
}

/**
 * Build standard servy-cli args for an install command.
 *
 * Single source of truth for the install invocation, shared by the
 * `ServyOsServiceAdapter` so port-driven and command-layer servy calls are
 * byte-identical. Structurally typed to avoid a kernel→public import of
 * `OsServiceInstallRequest`.
 */
export function servyInstallArgs(
  request: { serviceName: string; configPath: string; force: boolean },
): string[] {
  const args = ['install', '-n', request.serviceName, '-c', request.configPath, '-q'];
  if (request.force) {
    args.push('--force');
  }
  return args;
}

/** Build the full Windows service name from a short service name. */
export function fullServiceName(
  shortName: string,
  prefix: string = DEFAULT_SERVICE_PREFIX,
): string {
  return `${prefix}.${shortName}`;
}

/** Resolve and validate the servy-cli.exe path. */
export async function resolveServyCli(
  servyCliPath: string = DEFAULT_SERVY_CLI_PATH,
  requireExists: boolean = true,
): Promise<{ path: string; exists: boolean }> {
  const servyExists = await exists(servyCliPath);

  if (!servyExists && requireExists) {
    throw new Error(
      `Servy CLI not found at: ${servyCliPath}\n` +
        `Install Servy from https://github.com/aelassas/servy\n` +
        `Or specify the path with --servy-cli <path>`,
    );
  }

  return { path: servyCliPath, exists: servyExists };
}
