import { failDeployCommand } from '../../../../kernel/adapters/deploy/deploy-exit.ts';
import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
/**
 * @module commands/deploy/status
 *
 * `netscript deploy status [service]` — show the running status of all (or a
 * specific) registered services via Servy.
 *
 * CRITICAL: Uses `servy-cli status -n <name> -q` syntax — NOT positional args.
 * The positional form `servy-cli status <name>` does NOT work.
 */

import { Command } from '@cliffy/command';
import { bold, cyan, gray, green, red, yellow } from '@std/fmt/colors';
import { formatError, WindowsRequiredError } from '../../../../kernel/domain/errors.ts';
import {
  fullServiceName,
  getServiceNames,
  OPTION_DEFAULTS,
  printBanner,
  resolveManifest,
  resolveServyCli,
  runServy,
  servyLifecycleArgs,
} from '../../../../kernel/adapters/deploy/shared.ts';

export const statusCommand = new Command()
  .name('status')
  .description('Show running status of all registered services')
  .arguments('[service:string]')
  .option(
    '--install-dir <dir:string>',
    'Installation directory where services are deployed',
  )
  .option('--deploy-dir <dir:string>', 'Source deployment artifacts directory', {
    default: OPTION_DEFAULTS.deployDir,
  })
  .option('--servy-cli <path:string>', 'Path to servy-cli.exe', {
    default: OPTION_DEFAULTS.servyCli,
  })
  .option('-v, --verbose', 'Verbose output')
  .action(async (options, service?: string) => {
    if (Deno.build.os !== 'windows') {
      throw new WindowsRequiredError('status');
    }

    // ── Resolve manifest ─────────────────────────────────────────────────
    const { manifest, installDir } = await resolveManifest({
      installDir: options.installDir,
      deployDir: options.deployDir,
    }).catch((err: unknown) => {
      outputError(red(`✗ ${err instanceof Error ? err.message : String(err)}`));
      failDeployCommand('Deploy command failed.');
    });

    const verbose = options.verbose ?? false;

    printBanner(`NetScript Status — ${manifest.name} v${manifest.version}`);

    outputText(`📁 Install Dir: ${installDir}`);
    outputText('');

    // ── Resolve servy-cli ────────────────────────────────────────────────
    const servy = await resolveServyCli(options.servyCli).catch((err: unknown) => {
      outputError(red(`✗ ${err instanceof Error ? err.message : String(err)}`));
      failDeployCommand('Deploy command failed.');
    });

    // ── Get service list ─────────────────────────────────────────────────
    let serviceNames: string[];
    try {
      serviceNames = getServiceNames(manifest, 'start', service);
    } catch (err: unknown) {
      outputError(red(`✗ ${err instanceof Error ? err.message : String(err)}`));
      failDeployCommand('Deploy command failed.');
    }

    // ── Table header ─────────────────────────────────────────────────────
    outputText(
      gray('─'.repeat(63)),
    );
    outputText(
      `  ${'Service'.padEnd(24)} ${'Status'.padEnd(16)} ${'URL'}`,
    );
    outputText(
      gray('─'.repeat(63)),
    );

    let running = 0;
    let stopped = 0;
    let notInstalled = 0;
    let errors = 0;

    for (const name of serviceNames) {
      const windowsName = fullServiceName(name);
      const svcInfo = manifest.services[name];
      const urlLabel = svcInfo?.url ?? '';

      try {
        const args = servyLifecycleArgs('status', windowsName);
        const result = await runServy(servy.path, args, verbose);

        let statusLabel: string;
        const output = result.message.toLowerCase();

        if (!result.success || output.includes('not installed') || output.includes('not found')) {
          statusLabel = gray('not installed');
          notInstalled++;
        } else if (output.includes('running')) {
          statusLabel = green('running');
          running++;
        } else if (output.includes('stopped') || output.includes('not started')) {
          statusLabel = yellow('stopped');
          stopped++;
        } else if (output.includes('paused')) {
          statusLabel = yellow('paused');
          stopped++;
        } else if (output.includes('starting') || output.includes('pending')) {
          statusLabel = cyan('starting');
          running++;
        } else {
          // Unknown status — show raw output
          statusLabel = yellow(result.message.trim().substring(0, 14));
          stopped++;
        }

        outputText(
          `  ${name.padEnd(24)} ${statusLabel.padEnd(28)} ${gray(urlLabel)}`,
        );
      } catch (error: unknown) {
        outputText(
          `  ${name.padEnd(24)} ${red('error'.padEnd(16))} ${gray(formatError(error))}`,
        );
        errors++;
      }
    }

    // ── Summary ──────────────────────────────────────────────────────────
    outputText(gray('─'.repeat(63)));

    const parts: string[] = [];
    if (running > 0) parts.push(green(`${running} running`));
    if (stopped > 0) parts.push(yellow(`${stopped} stopped`));
    if (notInstalled > 0) parts.push(gray(`${notInstalled} not installed`));
    if (errors > 0) parts.push(red(`${errors} error(s)`));

    outputText(`  ${bold('Total')}: ${parts.join(', ')}`);
    outputText('');

    if (stopped > 0) {
      outputText(gray(`  Start services: netscript deploy start --install-dir "${installDir}"`));
      outputText('');
    }
  });
