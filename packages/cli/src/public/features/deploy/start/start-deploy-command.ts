import { failDeployCommand } from '../../../../kernel/adapters/deploy/deploy-exit.ts';
import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
/**
 * @module commands/deploy/start
 *
 * `netscript deploy start [service]` — start all (or a specific) registered
 * services via Servy.
 *
 * Starts in manifest order. Servy handles native dependency ordering via the
 * `--deps` flag configured at install time.
 *
 * CRITICAL: Uses `servy-cli start -n <name> -q` syntax — NOT positional args.
 * The positional form `servy-cli start <name>` does NOT work.
 */

import { Command } from '@cliffy/command';
import { bold as _bold, cyan as _cyan, green, red, yellow } from '@std/fmt/colors';
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
  runServy,
  servyLifecycleArgs,
} from '../../../../kernel/adapters/deploy/shared.ts';

export const startCommand: Command<any, any, any, any, any, any, any, any> = new Command()
  .name('start')
  .description('Start registered services via Servy (requires admin)')
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
  .option('--no-health-check', 'Skip health check waiting after start')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options, service?: string) => {
    if (Deno.build.os !== 'windows') {
      throw new WindowsRequiredError('start');
    }

    printBanner('NetScript Windows Service Startup');

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

    const verbose = options.verbose ?? false;

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

    // ── Get service list ─────────────────────────────────────────────────
    let serviceNames: string[];
    try {
      serviceNames = getServiceNames(manifest, 'start', service);
    } catch (err: unknown) {
      outputError(red(`✗ ${err instanceof Error ? err.message : String(err)}`));
      failDeployCommand('Deploy command failed.');
    }

    outputText(`🚀 Starting ${serviceNames.length} service(s)...`);
    outputText('');

    let started = 0;
    let failed = 0;
    let alreadyRunning = 0;

    for (const name of serviceNames) {
      const windowsName = fullServiceName(name);
      const svcInfo = manifest.services[name];
      const hasHealth = !!svcInfo?.health;

      outputText(`  ▶️  ${name}`);

      try {
        const args = servyLifecycleArgs('start', windowsName);
        const result = await runServy(servy.path, args, verbose);

        if (result.success) {
          // Optionally wait for health endpoint
          if (hasHealth && options.healthCheck !== false) {
            const healthy = await waitForHealth(svcInfo.health!, 10, 1500, name);
            if (healthy.ok) {
              outputText(
                `     ${green('✓')} Healthy (${
                  (healthy.elapsed / 1000).toFixed(1)
                }s, ${healthy.attempts} checks)`,
              );
            } else {
              outputText(
                `     ${yellow('⚠')} Started but health check failed after ${
                  (healthy.elapsed / 1000).toFixed(1)
                }s`,
              );
              outputText(
                `     ${yellow(`   Check logs for errors: netscript deploy logs ${name}`)}`,
              );
            }
          } else {
            outputText(`     ${green('✓')} Started`);
          }
          started++;
        } else {
          // Check if already running
          const msg = result.message.toLowerCase();
          if (msg.includes('already running') || msg.includes('already started')) {
            outputText(`     ${green('✓')} Already running`);
            alreadyRunning++;
            started++;
          } else {
            outputText(`     ${red('✗')} Failed: ${result.message}`);
            failed++;
          }
        }
      } catch (error: unknown) {
        outputText(`     ${red('✗')} Error: ${formatError(error)}`);
        failed++;
      }

      outputText(''); // blank line between services
    }

    // ── Summary ──────────────────────────────────────────────────────────
    const summaryLines: string[] = [];
    const parts: string[] = [];
    parts.push(`${green('✅')} Started: ${started}`);
    if (alreadyRunning > 0) parts.push(`(${alreadyRunning} already running)`);
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

// ============================================================================
// HEALTH CHECK
// ============================================================================

interface HealthResult {
  ok: boolean;
  /** Total elapsed time in milliseconds. */
  elapsed: number;
  /** Number of health check attempts made. */
  attempts: number;
}

/**
 * Poll a health endpoint until it returns HTTP 200 or we exhaust retries.
 *
 * Designed to be fast for services that boot quickly (first check after 1s)
 * and bail early for those that don't (max ~15s total, not 90s+).
 *
 * @param url         The full health URL (e.g., `http://localhost:3000/health`)
 * @param maxAttempts Maximum number of poll attempts (default 10)
 * @param intervalMs  Milliseconds between attempts (default 1500)
 * @param label       Service name for progress display
 */
async function waitForHealth(
  url: string,
  maxAttempts: number,
  intervalMs: number,
  _label: string,
): Promise<HealthResult> {
  const start = Date.now();
  const FETCH_TIMEOUT_MS = 3000;

  // Brief pause to let the service process actually start before first poll
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Write initial progress inline (no newline — we append dots)
  const encoder = new TextEncoder();
  Deno.stdout.writeSync(encoder.encode(`     ⏳ Health [${url}] `));

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        // Consume the body to free resources
        await response.text();
        // Clear the progress dots line
        Deno.stdout.writeSync(encoder.encode('\n'));
        return { ok: true, elapsed: Date.now() - start, attempts: attempt };
      }

      // Non-200 — consume body and retry
      await response.text();
      Deno.stdout.writeSync(encoder.encode('×'));
    } catch {
      // Connection refused, timeout, etc. — expected during startup
      Deno.stdout.writeSync(encoder.encode('.'));
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  // End the progress dots line
  Deno.stdout.writeSync(encoder.encode(` (${maxAttempts} attempts)\n`));
  return { ok: false, elapsed: Date.now() - start, attempts: maxAttempts };
}
