import { outputText } from '../../presentation/output/default-output.ts';
import { bold, cyan, gray, green, red, yellow } from '@std/fmt/colors';
import { exists } from '@std/fs';
import { join } from '@std/path';
import { DEPLOY_DIRS } from '../../constants/runtime.ts';
import { syncDeployToInstallDir, updateXmlPaths } from './commands/install.ts';
import {
  fullServiceName,
  getServiceNames,
  type Manifest,
  runServy,
  servyLifecycleArgs,
} from './shared.ts';
import type { UpgradeStepResult } from './upgrade-summary.ts';

interface StopStepOptions {
  readonly results: UpgradeStepResult[];
  readonly isDryRun: boolean;
  readonly serviceNames: readonly string[];
  readonly servyCli: string;
  readonly verbose: boolean;
}

export async function runStopStep(
  { results, isDryRun, serviceNames, servyCli, verbose }: StopStepOptions,
): Promise<void> {
  // ════════════════════════════════════════════════════════════════════════
  // STEP 2: STOP
  // ════════════════════════════════════════════════════════════════════════
  const stopStart = performance.now();
  outputText(bold(cyan('\n━━━ Step 2/5: Stop Services ━━━')));

  if (isDryRun) {
    outputText(yellow('   DRY RUN: Would stop all running services'));
    for (const name of serviceNames) {
      outputText(gray(`   • ${fullServiceName(name)}`));
    }
    results.push({
      name: 'Stop',
      success: true,
      skipped: true,
      message: `Would stop ${serviceNames.length} services`,
      durationMs: 0,
    });
  } else {
    let stopFailed = 0;
    let stopSuccess = 0;
    let stopSkipped = 0;

    for (const name of serviceNames) {
      const svcName = fullServiceName(name);
      const args = servyLifecycleArgs('stop', svcName);
      const result = await runServy(servyCli, args, verbose);

      if (result.success) {
        stopSuccess++;
        if (verbose) outputText(`   ${green('✓')} Stopped ${svcName}`);
      } else if (
        result.message.includes('not running') || result.message.includes('not installed') ||
        result.message.includes('does not exist')
      ) {
        stopSkipped++;
        if (verbose) outputText(gray(`   ○ ${svcName} (not running)`));
      } else {
        stopFailed++;
        if (verbose) outputText(`   ${yellow('⚠')} ${svcName}: ${result.message}`);
      }
    }

    outputText(`   Stopped: ${stopSuccess} | Skipped: ${stopSkipped} | Failed: ${stopFailed}`);

    results.push({
      name: 'Stop',
      success: stopFailed === 0,
      skipped: false,
      message: `${stopSuccess} stopped, ${stopSkipped} skipped, ${stopFailed} failed`,
      durationMs: performance.now() - stopStart,
    });

    // Don't abort on stop failures — services might not be installed yet
    if (stopFailed > 0) {
      outputText(yellow('   ⚠ Some services failed to stop — continuing anyway'));
    }
  }
}

interface CopyStepOptions {
  readonly results: UpgradeStepResult[];
  readonly isDryRun: boolean;
  readonly deployDir: string;
  readonly installDir: string;
  readonly manifest: Manifest;
  readonly verbose: boolean;
}

export async function runCopyStep(
  { results, isDryRun, deployDir, installDir, manifest, verbose }: CopyStepOptions,
): Promise<void> {
  const options = { deployDir };
  // ════════════════════════════════════════════════════════════════════════
  // STEP 3: COPY
  // ════════════════════════════════════════════════════════════════════════
  const copyStart = performance.now();
  outputText(bold(cyan('\n━━━ Step 3/5: Copy Artifacts ━━━')));

  if (isDryRun) {
    outputText(yellow('   DRY RUN: Would sync artifacts'));
    outputText(`   Source:      ${options.deployDir}`);
    outputText(`   Destination: ${installDir}`);
    results.push({
      name: 'Copy',
      success: true,
      skipped: true,
      message: 'Would sync artifacts',
      durationMs: 0,
    });
  } else {
    const copyResult = await syncDeployToInstallDir(
      options.deployDir,
      installDir,
      verbose,
    );

    // Update XML paths to match target install dir
    const targetConfigDir = join(installDir, DEPLOY_DIRS.CONFIG);
    if (await exists(targetConfigDir)) {
      const allServiceNames = Object.keys(manifest.services);
      await updateXmlPaths(targetConfigDir, installDir, allServiceNames, verbose);
    }

    const copySuccess = copyResult.failed === 0;
    results.push({
      name: 'Copy',
      success: copySuccess,
      skipped: false,
      message:
        `${copyResult.copied} copied, ${copyResult.skipped} unchanged, ${copyResult.failed} failed`,
      durationMs: performance.now() - copyStart,
    });

    if (copyResult.failed > 0) {
      outputText(
        yellow(`   ⚠ ${copyResult.failed} file(s) could not be copied (locked?)`),
      );
    }
  }
}

interface StartStepOptions {
  readonly results: UpgradeStepResult[];
  readonly isDryRun: boolean;
  readonly skipStart: boolean;
  readonly manifest: Manifest;
  readonly servyCli: string;
  readonly verbose: boolean;
}

export async function runStartStep(
  { results, isDryRun, skipStart, manifest, servyCli, verbose }: StartStepOptions,
): Promise<void> {
  const options = { skipStart };
  // ════════════════════════════════════════════════════════════════════════
  // STEP 5: START
  // ════════════════════════════════════════════════════════════════════════
  const startStart = performance.now();
  outputText(bold(cyan('\n━━━ Step 5/5: Start Services ━━━')));

  if (options.skipStart) {
    outputText(gray('   Skipped (--skip-start)'));
    results.push({
      name: 'Start',
      success: true,
      skipped: true,
      message: 'Skipped (--skip-start)',
      durationMs: 0,
    });
  } else if (isDryRun) {
    outputText(yellow('   DRY RUN: Would start all services'));
    results.push({
      name: 'Start',
      success: true,
      skipped: true,
      message: 'Would start services',
      durationMs: 0,
    });
  } else {
    // Start in forward order (dependencies first)
    const startNames = getServiceNames(manifest, 'start');
    let startSuccess = 0;
    let startFailed = 0;

    for (const name of startNames) {
      const svcName = fullServiceName(name);
      const args = servyLifecycleArgs('start', svcName);
      const result = await runServy(servyCli, args, verbose);

      if (result.success) {
        startSuccess++;
        if (verbose) outputText(`   ${green('✓')} Started ${svcName}`);
      } else {
        startFailed++;
        outputText(`   ${red('✗')} ${svcName}: ${result.message}`);
      }

      // Small delay between service starts for orderly startup
      if (startNames.indexOf(name) < startNames.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    outputText(`   Started: ${startSuccess} | Failed: ${startFailed}`);

    results.push({
      name: 'Start',
      success: startFailed === 0,
      skipped: false,
      message: `${startSuccess} started, ${startFailed} failed`,
      durationMs: performance.now() - startStart,
    });
  }
}
