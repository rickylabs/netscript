import { outputText } from '../../presentation/output/default-output.ts';
/**
 * @module commands/deploy/display
 *
 * Formatting helpers and defaults for deploy commands.
 */

import { basename, dirname } from '@std/path';
import { DEFAULT_DEPLOY_OUTPUT_DIR } from '../../constants/runtime.ts';
import { DEFAULT_SERVY_CLI_PATH } from '../../constants/windows.ts';

function resolveDefaultDeployDir(): string {
  const fromEnv = Deno.env.get('NETSCRIPT_DEPLOY_DIR');
  if (fromEnv) return fromEnv;

  const execName = basename(Deno.execPath()).replace(/\.exe$/i, '').toLowerCase();
  if (execName === 'netscript-cli') {
    return dirname(dirname(Deno.execPath()));
  }
  return DEFAULT_DEPLOY_OUTPUT_DIR;
}

/** Standard CLI option defaults shared across operational commands. */
export const OPTION_DEFAULTS = {
  deployDir: resolveDefaultDeployDir(),
  servyCli: DEFAULT_SERVY_CLI_PATH,
} as const;

/** Print a formatted header banner for a command. */
export function printBanner(title: string): void {
  const padded = ` ${title} `;
  const width = 63;
  const innerWidth = width - 2;
  const leftPad = Math.floor((innerWidth - padded.length) / 2);
  const rightPad = innerWidth - padded.length - leftPad;

  outputText('+' + '='.repeat(innerWidth) + '+');
  outputText('|' + ' '.repeat(leftPad) + padded + ' '.repeat(rightPad) + '|');
  outputText('+' + '='.repeat(innerWidth) + '+');
  outputText('');
}

/** Print a summary footer with counts. */
export function printSummary(lines: string[]): void {
  outputText('');
  outputText('='.repeat(63));
  for (const line of lines) {
    outputText(line);
  }
  outputText('='.repeat(63));
  outputText('');
}
