import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { failDeployCommand } from '../../../../kernel/adapters/deploy/deploy-exit.ts';
import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import { bold, cyan, gray, red, yellow } from '@std/fmt/colors';
import { DEFAULT_SERVICE_PREFIX as _DEFAULT_SERVICE_PREFIX } from '../../../../kernel/constants/windows.ts';
import { resolveInstallDir as _resolveInstallDir } from '../../../../kernel/adapters/runtime/platform/deno-platform.ts';
import {
  checkAdmin,
  getServiceNames,
  type Manifest,
  OPTION_DEFAULTS,
  printBanner,
  printSummary as _printSummary,
  resolveManifest,
  resolveServyCli,
} from '../../../../kernel/adapters/deploy/shared.ts';
import {
  runCopyStep,
  runStartStep,
  runStopStep,
} from '../../../../kernel/adapters/deploy/upgrade-steps.ts';
import {
  printUpgradeSummary,
  type UpgradeStepResult,
} from '../../../../kernel/adapters/deploy/upgrade-summary.ts';

// ============================================================================
// COMMAND
// ============================================================================

export const upgradeCommand: CliffyCommand = new Command()
  .name('upgrade')
  .description(
    'Build, sync, reinstall, and restart services in one step',
  )
  .option(
    '--deploy-dir <path:string>',
    'Deployment output directory',
    { default: OPTION_DEFAULTS.deployDir },
  )
  .option(
    '--install-dir <path:string>',
    'Target installation directory (default: auto-resolved from manifest)',
  )
  .option(
    '--servy-cli <path:string>',
    'Path to servy-cli.exe',
    { default: OPTION_DEFAULTS.servyCli },
  )
  .option(
    '--skip-compile',
    'Skip compilation (config-only upgrade — regenerate configs then sync)',
    { default: false },
  )
  .option(
    '--skip-install',
    'Skip Servy re-registration (just copy and restart)',
    { default: false },
  )
  .option(
    '--skip-start',
    'Do not start services after upgrade',
    { default: false },
  )
  .option(
    '--verbose',
    'Show detailed output for each step',
    { default: false },
  )
  .option(
    '--dry-run',
    'Show what would happen without making changes',
    { default: false },
  )
  .example(
    'Full upgrade',
    'netscript deploy upgrade',
  )
  .example(
    'Config-only upgrade (no recompile)',
    'netscript deploy upgrade --skip-compile',
  )
  .example(
    'Upgrade without reinstalling services',
    'netscript deploy upgrade --skip-install',
  )
  .example(
    'Dry run',
    'netscript deploy upgrade --dry-run --verbose',
  )
  .action(async (options) => {
    // Only supported on Windows
    if (Deno.build.os !== 'windows') {
      outputError(red('Deploy upgrade is only supported on Windows.'));
      failDeployCommand('Deploy command failed.');
    }

    const upgradeStart = performance.now();
    const isDryRun = options.dryRun;
    const verbose = options.verbose;

    printBanner('Deploy Upgrade — Full Cycle');

    // ── Pre-flight checks ──────────────────────────────────────────────────
    if (!isDryRun && !options.skipInstall) {
      const isAdminUser = await checkAdmin('upgrade', false);
      if (!isAdminUser) {
        outputError(
          yellow('   Admin privileges are required for service registration.'),
        );
        outputError(
          gray('   Use --skip-install to skip Servy registration, or run as Administrator.'),
        );
        outputError('');
        failDeployCommand('Deploy command failed.');
      }
    }

    // Validate Servy CLI availability (needed for stop/install/start)
    let servyCli: string;
    try {
      const resolved = await resolveServyCli(options.servyCli, !isDryRun);
      servyCli = resolved.path;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      outputError(red(`   ✗ ${msg}`));
      failDeployCommand('Deploy command failed.');
    }

    const results: UpgradeStepResult[] = [];

    // ════════════════════════════════════════════════════════════════════════
    // STEP 1: BUILD
    // ════════════════════════════════════════════════════════════════════════
    const buildStart = performance.now();
    outputText(bold(cyan('\n━━━ Step 1/5: Build ━━━')));

    if (isDryRun) {
      const mode = options.skipCompile ? 'config-only (--skip-compile)' : 'full compile';
      outputText(yellow(`   DRY RUN: Would run 'deploy build' (${mode})`));
      outputText(`   Output: ${options.deployDir}`);
      results.push({
        name: 'Build',
        success: true,
        skipped: true,
        message: `Would build (${mode})`,
        durationMs: 0,
      });
    } else {
      try {
        // Shell out to `deno run` with the build command
        // This reuses the full build pipeline including config resolution
        const buildArgs = [
          'run',
          '--allow-all',
          '--env-file=.env.local',
          '--env-file=.env',
          'packages/cli/bin/netscript.ts',
          'deploy',
          'build',
          `--deploy-dir=${options.deployDir}`,
        ];

        if (options.skipCompile) {
          buildArgs.push('--skip-compile');
        }
        if (verbose) {
          buildArgs.push('--verbose');
        }

        const buildCmd = new Deno.Command('deno', {
          args: buildArgs,
          cwd: Deno.cwd(),
          stdin: 'inherit',
          stdout: 'inherit',
          stderr: 'inherit',
        });

        const buildResult = await buildCmd.output();

        results.push({
          name: 'Build',
          success: buildResult.success,
          skipped: false,
          message: buildResult.success
            ? 'Build completed'
            : `Build failed (exit ${buildResult.code})`,
          durationMs: performance.now() - buildStart,
        });

        if (!buildResult.success) {
          outputError(red('\n   ✗ Build failed. Aborting upgrade.'));
          printUpgradeSummary(results, performance.now() - upgradeStart);
          failDeployCommand('Deploy command failed.');
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        results.push({
          name: 'Build',
          success: false,
          skipped: false,
          message: `Build error: ${msg}`,
          durationMs: performance.now() - buildStart,
        });
        outputError(red(`\n   ✗ Build error: ${msg}`));
        printUpgradeSummary(results, performance.now() - upgradeStart);
        failDeployCommand('Deploy command failed.');
      }
    }

    // ── Resolve manifest (needed for remaining steps) ──────────────────────
    let manifest: Manifest;
    let installDir: string;

    try {
      const resolved = await resolveManifest({
        installDir: options.installDir,
        deployDir: options.deployDir,
      });
      manifest = resolved.manifest;
      installDir = options.installDir ?? resolved.installDir;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      outputError(red(`\n   ✗ Cannot resolve manifest: ${msg}`));
      printUpgradeSummary(results, performance.now() - upgradeStart);
      failDeployCommand('Deploy command failed.');
    }

    const serviceNames = getServiceNames(manifest, 'stop');

    await runStopStep({ results, isDryRun, serviceNames, servyCli, verbose });

    await runCopyStep({
      results,
      isDryRun,
      deployDir: options.deployDir,
      installDir,
      manifest,
      verbose,
    });

    // ════════════════════════════════════════════════════════════════════════
    // STEP 4: INSTALL (re-register with Servy)
    // ════════════════════════════════════════════════════════════════════════
    const installStart = performance.now();
    outputText(bold(cyan('\n━━━ Step 4/5: Install (Servy Registration) ━━━')));

    if (options.skipInstall) {
      outputText(gray('   Skipped (--skip-install)'));
      results.push({
        name: 'Install',
        success: true,
        skipped: true,
        message: 'Skipped (--skip-install)',
        durationMs: 0,
      });
    } else if (isDryRun) {
      outputText(yellow('   DRY RUN: Would reinstall all services with --force'));
      results.push({
        name: 'Install',
        success: true,
        skipped: true,
        message: 'Would reinstall services',
        durationMs: 0,
      });
    } else {
      // Shell out to the install command with --force
      try {
        const installArgs = [
          'run',
          '--allow-all',
          '--env-file=.env.local',
          '--env-file=.env',
          'packages/cli/bin/netscript.ts',
          'deploy',
          'install',
          `--deploy-dir=${options.deployDir}`,
          `--install-dir=${installDir}`,
          '--force',
        ];

        if (verbose) {
          installArgs.push('--verbose');
        }

        const installCmd = new Deno.Command('deno', {
          args: installArgs,
          cwd: Deno.cwd(),
          stdin: 'inherit',
          stdout: 'inherit',
          stderr: 'inherit',
        });

        const installResult = await installCmd.output();

        results.push({
          name: 'Install',
          success: installResult.success,
          skipped: false,
          message: installResult.success
            ? 'Services re-registered'
            : `Install failed (exit ${installResult.code})`,
          durationMs: performance.now() - installStart,
        });

        if (!installResult.success) {
          outputError(yellow('\n   ⚠ Install failed — services may need manual registration'));
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        results.push({
          name: 'Install',
          success: false,
          skipped: false,
          message: `Install error: ${msg}`,
          durationMs: performance.now() - installStart,
        });
        outputError(yellow(`\n   ⚠ Install error: ${msg}`));
      }
    }

    await runStartStep({
      results,
      isDryRun,
      skipStart: options.skipStart,
      manifest,
      servyCli,
      verbose,
    });

    // ════════════════════════════════════════════════════════════════════════
    // SUMMARY
    // ════════════════════════════════════════════════════════════════════════
    printUpgradeSummary(results, performance.now() - upgradeStart);

    // Exit with error code if any non-skipped step failed
    const failures = results.filter((r) => !r.success && !r.skipped);
    if (failures.length > 0) {
      failDeployCommand('Deploy command failed.');
    }
  });
