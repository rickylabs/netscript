import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { failDeployCommand } from '../../../../kernel/adapters/deploy/deploy-exit.ts';
import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
/**
 * @module commands/deploy/stop
 *
 * `netscript deploy stop [service]` — stop all (or a specific) registered
 * services via Servy.
 *
 * Stops in reverse manifest order (dependents first, then dependencies).
 *
 * CRITICAL: Uses `servy-cli stop -n <name> -q` syntax — NOT positional args.
 * The positional form `servy-cli stop <name>` does NOT work.
 */

import { Command } from '@cliffy/command';
import { green, red, yellow } from '@std/fmt/colors';
import { formatError, WindowsRequiredError } from '../../../../kernel/domain/errors.ts';
import {
  checkAdmin,
  fullServiceName,
  getServiceNames,
  OPTION_DEFAULTS,
  printBanner,
  printSummary,
  resolveManifest,
  resolveServyCli,
} from '../../../../kernel/adapters/deploy/shared.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import { createOsServicePort } from '../../../adapters/os-service-factory.ts';

export const stopCommand: CliffyCommand = new Command()
  .name('stop')
  .description('Stop registered services via Servy (requires admin)')
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
      throw new WindowsRequiredError('stop');
    }

    printBanner('NetScript Windows Service Shutdown');

    // ── Admin check (warn only — let servy-cli fail with a clear error
    // if privileges are truly missing; `net session` can be flaky) ────────
    await checkAdmin('start/stop services');

    // ── Resolve manifest ─────────────────────────────────────────────────
    const { manifest, installDir } = await resolveManifest({
      installDir: options.installDir,
      deployDir: options.deployDir,
    }).catch((err: unknown) => {
      outputError(red(`✗ ${err instanceof Error ? err.message : String(err)}`));
      failDeployCommand('Deploy command failed.');
    });

    outputText(`📦 App:         ${manifest.name} v${manifest.version}`);
    outputText(`📁 Install Dir: ${installDir}`);
    outputText('');

    // ── Resolve servy-cli ────────────────────────────────────────────────
    const servy = await resolveServyCli(options.servyCli).catch((err: unknown) => {
      outputError(red(`✗ ${err instanceof Error ? err.message : String(err)}`));
      failDeployCommand('Deploy command failed.');
    });

    outputText(`✓ Servy CLI: ${servy.path}`);
    outputText('');

    // ── Windows service lifecycle port (servy adapter) ───────────────────
    const services = createOsServicePort('windows', {
      process: new DenoProcess(),
      servyCliPath: servy.path,
    });

    // ── Get service list (reverse order for stop) ────────────────────────
    let serviceNames: string[];
    try {
      serviceNames = getServiceNames(manifest, 'stop', service);
    } catch (err: unknown) {
      outputError(red(`✗ ${err instanceof Error ? err.message : String(err)}`));
      failDeployCommand('Deploy command failed.');
    }

    outputText(`⏹️  Stopping ${serviceNames.length} service(s)...`);
    outputText('');

    let stopped = 0;
    let failed = 0;
    let notRunning = 0;

    for (const name of serviceNames) {
      const windowsName = fullServiceName(name);

      outputText(`  ⏹️  ${name}`);

      try {
        const result = await services.run('stop', windowsName);

        if (result.success) {
          outputText(`     ${green('✓')} Stopped`);
          stopped++;
        } else {
          // Check if service was already stopped or not installed
          const msg = result.message.toLowerCase();
          if (
            msg.includes('not running') ||
            msg.includes('already stopped') ||
            msg.includes('not started') ||
            msg.includes('stopped')
          ) {
            outputText(`     ${yellow('–')} Not running`);
            notRunning++;
          } else if (msg.includes('not installed') || msg.includes('not found')) {
            outputText(`     ${yellow('–')} Not installed`);
            notRunning++;
          } else {
            outputText(`     ${red('✗')} Failed: ${result.message}`);
            failed++;
          }
        }
      } catch (error: unknown) {
        outputText(`     ${red('✗')} Error: ${formatError(error)}`);
        failed++;
      }
    }

    // ── Summary ──────────────────────────────────────────────────────────
    const summaryLines: string[] = [];
    const parts: string[] = [];
    parts.push(`${green('✅')} Stopped: ${stopped}`);
    if (notRunning > 0) parts.push(`${yellow('–')} Not running: ${notRunning}`);
    if (failed > 0) parts.push(`${red('❌')} Failed: ${failed}`);
    summaryLines.push(parts.join('  '));

    printSummary(summaryLines);

    if (failed > 0) {
      outputText('💡 Troubleshooting:');
      outputText(`   View status:  netscript deploy status --install-dir "${installDir}"`);
      outputText(`   View logs:    netscript deploy logs <service> --install-dir "${installDir}"`);
      outputText(`   Log location: ${installDir}\\logs\\`);
      outputText('');
      failDeployCommand('Deploy command failed.');
    }
  });
