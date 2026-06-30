/** Generic command-line parsing helpers shared by plugin CLIs. */

import type { PluginCliArgs } from '../types.ts';

/** Normalized argv tokens with the binary/runtime wrapper removed by the caller. */
export interface NormalizedPluginArgv {
  /** Positional tokens that are not flags. */
  readonly values: readonly string[];
  /** Parsed `--flag`, `--flag=value`, and `--no-flag` values. */
  readonly flags: Readonly<Record<string, string | boolean>>;
}

/**
 * Normalize raw argv tokens into positional values and simple long flags.
 *
 * @param argv - Raw argument tokens supplied after the plugin command name.
 * @returns Parsed values and flags.
 */
export function normalizePluginArgv(argv: readonly string[]): NormalizedPluginArgv {
  const flags: Record<string, string | boolean> = {};
  const values: string[] = [];

  for (const token of argv) {
    if (!token.startsWith('--') || token === '--') {
      values.push(token);
      continue;
    }

    const body = token.slice(2);
    if (body.startsWith('no-')) {
      flags[body.slice(3)] = false;
      continue;
    }

    const separator = body.indexOf('=');
    if (separator === -1) {
      flags[body] = true;
      continue;
    }

    flags[body.slice(0, separator)] = body.slice(separator + 1);
  }

  return Object.freeze({ values: Object.freeze(values), flags: Object.freeze(flags) });
}

/**
 * Parse a plugin command argv into the shared `PluginCliArgs` contract.
 *
 * @param argv - Raw argument tokens with the command as the first token.
 * @returns Parsed plugin CLI arguments.
 */
export function parsePluginCliArgs(argv: readonly string[]): PluginCliArgs {
  const [command = 'info', ...rest] = argv;
  const normalized = normalizePluginArgv(rest);
  return Object.freeze({
    command,
    flags: normalized.flags,
    values: normalized.values,
  });
}
