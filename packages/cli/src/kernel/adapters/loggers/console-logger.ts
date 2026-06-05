/**
 * Console-backed logger adapter for CLI workflows.
 */

import { bold, cyan, gray, green, red, yellow } from '@std/fmt/colors';
import {
  outputError,
  outputText,
  outputWarning,
} from '../../presentation/output/default-output.ts';
import { BaseLogger } from './base-logger.ts';

/** Logger adapter backed by the host console. */
export class ConsoleLogger extends BaseLogger {
  override write(level: 'debug' | 'error' | 'info' | 'warn', message: string): void {
    switch (level) {
      case 'error':
        outputError(message);
        return;
      case 'warn':
        outputWarning(message);
        return;
      default:
        outputText(message);
        return;
    }
  }
}

// ============================================================================
// BANNERS
// ============================================================================

/**
 * Print a bordered banner for a major command.
 *
 * ```
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║          NetScript Windows Deployment - BUILD                 ║
 * ╚═══════════════════════════════════════════════════════════════╝
 * ```
 */
export function printBanner(title: string): void {
  const width = 63;
  const inner = width - 2;
  const padded = title.length >= inner
    ? title.substring(0, inner)
    : title.padStart(Math.floor((inner + title.length) / 2)).padEnd(inner);

  outputText(`╔${'═'.repeat(inner)}╗`);
  outputText(`║${padded}║`);
  outputText(`╚${'═'.repeat(inner)}╝`);
  outputText('');
}

/**
 * Print a section separator with a title.
 */
export function printSection(title: string): void {
  outputText('════════════════════════════════════════════════════════════════');
  outputText(title);
  outputText('════════════════════════════════════════════════════════════════');
}

/**
 * Print a horizontal divider.
 */
export function printDivider(char = '─', width = 55): void {
  outputText(gray(char.repeat(width)));
}

// ============================================================================
// STEP TRACKING
// ============================================================================

/**
 * Print a step header with emoji.
 *
 * @example
 *   printStep('🔨', 'Compiling services to Windows executables...');
 */
export function printStep(emoji: string, message: string): void {
  outputText(`${emoji} ${message}`);
}

/**
 * Print a success line.
 */
export function printSuccess(message: string): void {
  outputText(`   ${green('✓')} ${message}`);
}

/**
 * Print a failure line.
 */
export function printFailure(message: string): void {
  outputText(`   ${red('✗')} ${message}`);
}

/**
 * Print a warning line.
 */
export function printWarning(message: string): void {
  outputText(`   ${yellow('⚠')} ${message}`);
}

/**
 * Print a skip line.
 */
export function printSkip(message: string): void {
  outputText(`⏭️  ${message}`);
}

/**
 * Print an info line (indented).
 */
export function printInfo(message: string): void {
  outputText(`   ℹ  ${message}`);
}

/**
 * Print a detail line (double-indented, gray).
 */
export function printDetail(message: string): void {
  outputText(gray(`      ${message}`));
}

/**
 * Print a key-value pair, aligned.
 */
export function printKeyValue(key: string, value: string, indent = 0): void {
  const pad = ' '.repeat(indent);
  outputText(`${pad}${key.padEnd(16)} ${value}`);
}

// ============================================================================
// DRY-RUN OUTPUT
// ============================================================================

/**
 * Print a dry-run label prefix.
 */
export function printDryRun(message: string): void {
  outputText(`  ${cyan('[dry-run]')} ${message}`);
}

/**
 * Print a dry-run command that would be executed.
 */
export function printDryRunCommand(executable: string, args: string[]): void {
  const quoted = args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ');
  outputText(`  ${cyan('[dry-run]')} "${executable}" ${quoted}`);
}

/**
 * Print a dry-run argument (indented under the command).
 * Masks values for sensitive arguments like --password.
 */
export function printDryRunArg(arg: string): void {
  const safe = arg.startsWith('--password=')
    ? '--password=<***>'
    : arg.startsWith('--env=')
    ? '--env=<...env vars...>'
    : arg;
  outputText(`     ${safe}`);
}

// ============================================================================
// VERBOSE HELPERS
// ============================================================================

/**
 * Print a verbose-only message (typically called behind a `if (verbose)` guard).
 */
export function printVerbose(message: string): void {
  outputText(gray(`  [verbose] ${message}`));
}

/**
 * Print a verbose command execution.
 */
export function printVerboseCmd(executable: string, args: string[]): void {
  const quoted = args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ');
  outputText(gray(`    Cmd: "${executable}" ${quoted}`));
}

/**
 * Print verbose output from a command.
 */
export function printVerboseOutput(output: string): void {
  if (output && output !== 'OK') {
    outputText(gray(`    Output: ${output}`));
  }
}

// ============================================================================
// SUMMARY / RESULTS
// ============================================================================

/**
 * Print a final success summary.
 */
export function printCompletionSuccess(message: string): void {
  outputText('');
  outputText(`${green('✅')} ${bold(message)}`);
}

/**
 * Print a final failure summary.
 */
export function printCompletionFailure(message: string): void {
  outputText('');
  outputText(`${red('❌')} ${bold(message)}`);
}

/**
 * Print a "next steps" block at the end of a command.
 */
export function printNextSteps(steps: string[]): void {
  outputText('');
  outputText('Next steps:');
  for (let i = 0; i < steps.length; i++) {
    outputText(`  ${i + 1}. ${steps[i]}`);
  }
  outputText('');
}

/**
 * Print install/uninstall result tallies.
 */
export function printTally(
  label: string,
  succeeded: number,
  total: number,
  failed?: number,
): void {
  if (failed && failed > 0) {
    outputText(`${green('✅')} ${label}: ${succeeded}  ${red('❌')} Failed: ${failed}`);
  } else {
    outputText(`${green('✓')} ${succeeded}/${total} ${label}`);
  }
}

// ============================================================================
// PROGRESS
// ============================================================================

/**
 * Write an inline progress update (carriage return + erase line, no newline).
 * The \x1b[K erase prevents leftover characters when a shorter message follows
 * a longer one. Call `clearProgress()` when done.
 */
export function writeProgress(message: string): void {
  Deno.stdout.writeSync(new TextEncoder().encode(`\r\x1b[K  ${message}`));
}

/**
 * Clear an inline progress line and advance to a new line.
 * The trailing \n is required on Windows PowerShell: without it, subsequent
 * outputText output can stall until the user presses Enter.
 */
export function clearProgress(): void {
  Deno.stdout.writeSync(new TextEncoder().encode('\r\x1b[K\n'));
}

// ============================================================================
// TABLE OUTPUT
// ============================================================================

/**
 * Print a simple two-column table row with consistent alignment.
 */
export function printTableRow(
  col1: string,
  col2: string,
  col1Width = 22,
  col2Width = 20,
): void {
  outputText(`  ${col1.padEnd(col1Width)} ${col2.padEnd(col2Width)}`);
}

/**
 * Print a summary table header.
 */
export function printTableHeader(col1: string, col2: string, col1Width = 22): void {
  outputText(bold(`  ${col1.padEnd(col1Width)} ${col2}`));
  printDivider('─', col1Width + 30);
}

// ============================================================================
// CONFIG DISPLAY
// ============================================================================

/**
 * Print configuration details in a structured format.
 *
 * @example
 *   printConfig({
 *     'Project': 'test-app v1.0.0',
 *     'Targets': '10 services to compile',
 *     'Output': './.deploy/windows',
 *   });
 */
export function printConfig(entries: Record<string, string>): void {
  printDivider('─', 50);
  for (const [key, value] of Object.entries(entries)) {
    outputText(`${key.padEnd(12)} ${value}`);
  }
  printDivider('─', 50);
}

// ============================================================================
// FORMATTING HELPERS
// ============================================================================

/**
 * Format a byte size into a human-readable string.
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Format a duration in milliseconds into a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = ((ms % 60_000) / 1000).toFixed(1);
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/**
 * Mask a password inside a connection string URI.
 * Replaces the password segment with `****` for safe display.
 */
export function maskConnectionString(connectionString: string): string {
  return connectionString.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
}
