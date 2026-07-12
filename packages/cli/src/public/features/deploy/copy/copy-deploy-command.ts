import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { failDeployCommand } from '../../../../kernel/adapters/deploy/deploy-exit.ts';
import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
/**
 * @module commands/deploy/copy
 *
 * `netscript deploy copy` — sync build artifacts from deploy dir to install dir
 * without registering services with Servy.
 *
 * This is the "deploy" step separated from "install". Useful when:
 * - Services are already registered with Servy and you just need to update binaries/configs
 * - You want to copy artifacts to a remote machine before running `install`
 * - You need to update configs without stopping/restarting services
 *
 * The command:
 * 1. Resolves the manifest from deploy-dir or install-dir
 * 2. Syncs bin/, config/, logs/, runtime/, scripts/ directories
 * 3. Syncs root-level .env, .env.template, services.json
 * 4. Updates XML paths to match the target install directory
 *
 * Unlike `install`, this does NOT require admin privileges.
 */

import { Command } from '@cliffy/command';
import { bold as _bold, cyan as _cyan, gray, green, red, yellow } from '@std/fmt/colors';
import { join } from '@std/path';
import { exists } from '@std/fs';
import { DEPLOY_DIRS } from '../../../../kernel/constants/runtime.ts';
import { resolveInstallDir as _resolveInstallDir } from '../../../../kernel/adapters/runtime/platform/deno-platform.ts';
import {
  type Manifest,
  OPTION_DEFAULTS,
  printBanner,
  printSummary,
  resolveManifest,
} from '../../../../kernel/adapters/deploy/shared.ts';
import {
  syncDeployToInstallDir,
  updateXmlPaths,
} from '../../../../kernel/adapters/deploy/commands/install.ts';

// ============================================================================
// COMMAND
// ============================================================================

export const copyCommand: CliffyCommand = new Command()
  .name('copy')
  .description(
    'Copy build artifacts to the install directory (no Servy registration)',
  )
  .option(
    '--deploy-dir <path:string>',
    'Source directory containing build output (bin/, config/, scripts/)',
    { default: OPTION_DEFAULTS.deployDir },
  )
  .option(
    '--install-dir <path:string>',
    'Target installation directory (default: auto-resolved from manifest)',
  )
  .option(
    '--verbose',
    'Show detailed file-by-file output',
    { default: false },
  )
  .option(
    '--dry-run',
    'Show what would be copied without making changes',
    { default: false },
  )
  .example(
    'Basic copy',
    'netscript deploy copy',
  )
  .example(
    'Custom install dir',
    'netscript deploy copy --install-dir "D:\\Apps\\test-app"',
  )
  .example(
    'Verbose dry run',
    'netscript deploy copy --dry-run --verbose',
  )
  .action(async (options) => {
    // Only supported on Windows
    if (Deno.build.os !== 'windows') {
      outputError(red('Deploy copy is only supported on Windows.'));
      failDeployCommand('Deploy command failed.');
    }

    const isDryRun = options.dryRun;
    const verbose = options.verbose;

    printBanner('Deploy Copy — Sync Artifacts');

    // ── Resolve manifest ───────────────────────────────────────────────────
    outputText('📋 Resolving deployment manifest...');

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
      outputError(red(`\n   ✗ ${msg}`));
      failDeployCommand('Deploy command failed.');
    }

    outputText(`   Project:     ${manifest.name} v${manifest.version}`);
    outputText(`   Source:      ${options.deployDir}`);
    outputText(`   Destination: ${installDir}`);
    outputText('');

    // ── Validate source ────────────────────────────────────────────────────
    const sourceExists = await exists(options.deployDir);
    if (!sourceExists) {
      outputError(red(`   ✗ Source directory not found: ${options.deployDir}`));
      outputError('');
      outputError("   Run 'netscript deploy build' first to create the deployment artifacts.");
      failDeployCommand('Deploy command failed.');
    }

    const binDir = join(options.deployDir, DEPLOY_DIRS.BIN);
    const configDir = join(options.deployDir, DEPLOY_DIRS.CONFIG);

    const hasBin = await exists(binDir);
    const hasConfig = await exists(configDir);

    if (!hasBin && !hasConfig) {
      outputError(red('   ✗ No bin/ or config/ found in deploy directory.'));
      outputError('');
      outputError("   Run 'netscript deploy build' first.");
      failDeployCommand('Deploy command failed.');
    }

    if (verbose) {
      outputText(gray(`   bin/ exists:    ${hasBin}`));
      outputText(gray(`   config/ exists: ${hasConfig}`));
      outputText('');
    }

    // ── Dry run ────────────────────────────────────────────────────────────
    if (isDryRun) {
      outputText(yellow('🔍 DRY RUN — showing what would be copied:'));
      outputText('');
      outputText(`   Source:      ${options.deployDir}`);
      outputText(`   Destination: ${installDir}`);
      outputText('');

      const dirs = ['bin', 'config', 'logs', 'runtime', 'scripts'];
      for (const dir of dirs) {
        const srcPath = join(options.deployDir, dir);
        if (await exists(srcPath)) {
          let fileCount = 0;
          for await (const entry of Deno.readDir(srcPath)) {
            if (entry.isFile) fileCount++;
          }
          outputText(`   📁 ${dir}/  (${fileCount} files)`);
        }
      }

      const rootFiles = ['.env', '.env.template', 'services.json'];
      for (const fileName of rootFiles) {
        const srcPath = join(options.deployDir, fileName);
        if (await exists(srcPath)) {
          outputText(`   📄 ${fileName}`);
        } else {
          // Check config/ for services.json
          if (fileName === 'services.json') {
            const altPath = join(options.deployDir, DEPLOY_DIRS.CONFIG, fileName);
            if (await exists(altPath)) {
              outputText(`   📄 config/${fileName} → ${fileName}`);
            }
          }
        }
      }

      outputText('');
      outputText(yellow('   No files were modified (dry run).'));
      outputText('');
      return;
    }

    // ── Sync files ─────────────────────────────────────────────────────────
    const result = await syncDeployToInstallDir(
      options.deployDir,
      installDir,
      verbose,
    );

    // ── Update XML paths ───────────────────────────────────────────────────
    const serviceNames = Object.keys(manifest.services);
    const targetConfigDir = join(installDir, DEPLOY_DIRS.CONFIG);

    if (await exists(targetConfigDir)) {
      await updateXmlPaths(targetConfigDir, installDir, serviceNames, verbose);
    }

    // ── Summary ────────────────────────────────────────────────────────────
    const summaryParts: string[] = [];
    summaryParts.push(`${green('✅')} Copy complete!`);
    summaryParts.push(`   Files: ${result.copied} copied, ${result.skipped} unchanged`);

    if (result.failed > 0) {
      summaryParts.push(
        `   ${
          yellow('⚠')
        } ${result.failed} file(s) locked — stop services first to update binaries`,
      );
    }

    summaryParts.push('');
    summaryParts.push('Next steps:');

    if (result.failed > 0) {
      summaryParts.push('  1. Stop services:   netscript deploy stop');
      summaryParts.push('  2. Re-copy:         netscript deploy copy');
      summaryParts.push('  3. Start services:  netscript deploy start');
    } else {
      summaryParts.push('  • If services are already registered:');
      summaryParts.push('      netscript deploy stop && netscript deploy start');
      summaryParts.push('  • If services need registration:');
      summaryParts.push('      netscript deploy install --force');
    }

    printSummary(summaryParts);
  });
