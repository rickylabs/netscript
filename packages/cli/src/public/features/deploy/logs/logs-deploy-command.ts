import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { failDeployCommand } from '../../../../kernel/adapters/deploy/deploy-exit.ts';
import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
/**
 * @module commands/deploy/logs
 *
 * `netscript deploy logs <service>` — show recent log output for a specific
 * service.
 *
 * Resolves the log directory from `--install-dir` (preferred) or falls back
 * to `--deploy-dir/logs`. Uses the shared manifest resolution so it works
 * on both the build machine and the target machine.
 */

import { Command } from '@cliffy/command';
import { bold, cyan, gray, red, yellow } from '@std/fmt/colors';
import { join } from '@std/path';
import { exists } from '@std/fs';
import { WindowsRequiredError } from '../../../../kernel/domain/errors.ts';
import { OPTION_DEFAULTS, resolveManifest } from '../../../../kernel/adapters/deploy/shared.ts';

export const logsCommand: CliffyCommand = new Command()
  .name('logs')
  .description('Show recent logs for a service')
  .arguments('<service:string>')
  .option(
    '--install-dir <dir:string>',
    'Installation directory where services are deployed',
  )
  .option('--deploy-dir <dir:string>', 'Source deployment artifacts directory', {
    default: OPTION_DEFAULTS.deployDir,
  })
  .option('-n, --lines <n:integer>', 'Number of log lines to show', { default: 50 })
  .option('--errors', 'Show error log instead of stdout log')
  .option('--list', 'List all available log files instead of showing content')
  .option('-f, --follow', 'Continuously follow the log file (tail -f)')
  .action(async (options, service: string) => {
    if (Deno.build.os !== 'windows') {
      throw new WindowsRequiredError('logs');
    }

    // ── Resolve log directory ──────────────────────────────────────────
    // Try to load the manifest to find the install dir, but don't fail
    // if it's missing — fall back to deploy-dir/logs.
    let logsDir: string;

    if (options.installDir) {
      logsDir = join(options.installDir, 'logs');
    } else {
      try {
        const { installDir } = await resolveManifest({
          installDir: options.installDir,
          deployDir: options.deployDir,
        });
        logsDir = join(installDir, 'logs');
      } catch {
        // Manifest not available — use deploy dir
        logsDir = join(options.deployDir, 'logs');
      }
    }

    // ── List mode ────────────────────────────────────────────────────────
    if (options.list) {
      outputText(bold(cyan('Available Log Files')));
      outputText(gray(`Directory: ${logsDir}`));
      outputText(gray('─'.repeat(55)));

      try {
        const files: { name: string; size: number; modified: Date }[] = [];

        for await (const entry of Deno.readDir(logsDir)) {
          if (!entry.isFile) continue;
          try {
            const stat = await Deno.stat(join(logsDir, entry.name));
            files.push({
              name: entry.name,
              size: stat.size,
              modified: stat.mtime ?? new Date(0),
            });
          } catch {
            files.push({ name: entry.name, size: 0, modified: new Date(0) });
          }
        }

        if (files.length === 0) {
          outputText(gray('  No log files found.'));
        } else {
          // Sort by name
          files.sort((a, b) => a.name.localeCompare(b.name));

          outputText(
            `  ${'File'.padEnd(32)} ${'Size'.padStart(10)} ${'Modified'}`,
          );
          outputText(gray('  ' + '─'.repeat(53)));

          for (const file of files) {
            const sizeStr = formatFileSize(file.size);
            const dateStr = file.modified.toISOString().replace('T', ' ').substring(0, 19);
            outputText(
              `  ${file.name.padEnd(32)} ${sizeStr.padStart(10)} ${gray(dateStr)}`,
            );
          }
        }

        outputText('');
        return;
      } catch (error: unknown) {
        if (error instanceof Deno.errors.NotFound) {
          outputText(gray(`  Log directory not found: ${logsDir}`));
          outputText(gray('  Services may not have been started yet.'));
        } else {
          outputError(
            red(`Failed to list logs: ${error instanceof Error ? error.message : String(error)}`),
          );
        }
        outputText('');
        return;
      }
    }

    // ── Show log content ─────────────────────────────────────────────────
    const logFile = options.errors
      ? join(logsDir, `${service}-error.log`)
      : join(logsDir, `${service}.log`);

    outputText(bold(cyan(`Logs: ${service}${options.errors ? ' (errors)' : ''}`)));
    outputText(gray(logFile));
    outputText(gray('─'.repeat(55)));

    // ── Follow mode ──────────────────────────────────────────────────────
    if (options.follow) {
      await followLog(logFile);
      return;
    }

    // ── Static tail mode ─────────────────────────────────────────────────
    try {
      const text = await Deno.readTextFile(logFile);
      const lines = text.split('\n').filter((l) => l.trim());
      const tail = lines.slice(-options.lines);

      if (tail.length === 0) {
        outputText(gray('  (empty log file)'));
      } else {
        if (lines.length > options.lines) {
          outputText(
            gray(`  ... showing last ${options.lines} of ${lines.length} lines ...`),
          );
          outputText('');
        }
        outputText(tail.join('\n'));
      }
    } catch (error: unknown) {
      if (error instanceof Deno.errors.NotFound) {
        outputText(gray(`No log file found at: ${logFile}`));
        outputText('');

        // Suggest available logs
        try {
          const availableFiles: string[] = [];
          for await (const entry of Deno.readDir(logsDir)) {
            if (entry.isFile && entry.name.includes(service)) {
              availableFiles.push(entry.name);
            }
          }
          if (availableFiles.length > 0) {
            outputText(yellow('Available log files for this service:'));
            for (const f of availableFiles) {
              outputText(`  ${f}`);
            }
          } else {
            outputText(gray('The service may not have been started yet.'));
          }
        } catch {
          // logs dir doesn't exist at all
          outputText(gray('The services may not have been started yet.'));
        }
      } else {
        outputError(
          red(`Failed to read log: ${error instanceof Error ? error.message : String(error)}`),
        );
        failDeployCommand('Deploy command failed.');
      }
    }

    outputText('');
  });

// ============================================================================
// FOLLOW MODE (tail -f)
// ============================================================================

/**
 * Continuously follow a log file, printing new lines as they appear.
 * Blocks until the user presses Ctrl+C.
 */
async function followLog(logFile: string): Promise<void> {
  const fileExists = await exists(logFile);
  if (!fileExists) {
    outputText(gray(`Waiting for log file: ${logFile}`));
  }

  // Wait for file to appear
  while (!(await exists(logFile))) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  let lastSize = 0;
  try {
    const stat = await Deno.stat(logFile);
    lastSize = stat.size;

    // Print last few lines first
    const text = await Deno.readTextFile(logFile);
    const lines = text.split('\n').filter((l) => l.trim());
    const tail = lines.slice(-20);
    if (tail.length > 0) {
      outputText(gray('  ... last 20 lines ...'));
      outputText(tail.join('\n'));
    }
  } catch {
    // File may have disappeared again — just start fresh
  }

  outputText(gray('  --- following (Ctrl+C to stop) ---'));

  // Poll for changes
  while (true) {
    try {
      const stat = await Deno.stat(logFile);
      if (stat.size > lastSize) {
        const file = await Deno.open(logFile, { read: true });
        try {
          await file.seek(lastSize, Deno.SeekMode.Start);
          const buf = new Uint8Array(stat.size - lastSize);
          await file.read(buf);
          const newContent = new TextDecoder().decode(buf);
          if (newContent.trim()) {
            Deno.stdout.writeSync(new TextEncoder().encode(newContent));
          }
          lastSize = stat.size;
        } finally {
          file.close();
        }
      } else if (stat.size < lastSize) {
        // File was truncated (rotated) — reset
        lastSize = 0;
        outputText(gray('  --- log rotated ---'));
      }
    } catch {
      // File temporarily unavailable (rotation in progress)
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format a byte size into a human-readable string.
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}
