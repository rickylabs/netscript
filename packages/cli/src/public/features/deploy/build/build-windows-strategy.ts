import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
/**
 * @module public/features/deploy/build/build-windows-strategy
 *
 * CompiledWindowsStrategy — the NetScript Windows Services deployment adapter.
 *
 * Orchestrates the full build pipeline:
 * 1. Run app prebuild steps (e.g. Fresh/Vite build)
 * 2. Extract compile targets from ResolvedConfig
 * 3. Compile all targets to .exe binaries (deno compile)
 * 3. Generate Servy XML configurations
 * 4. Write service discovery manifest (services.json)
 * 5. Generate runtime override scaffolding (.deploy/windows/config/runtime/)
 * 6. Generate .env file (deploy root, NOT config/)
 * 7. Generate .env.template (deploy root)
 *
 * The compiled .exe binaries are self-contained — no Deno runtime required
 * on the deployment target. Servy manages service lifecycle.
 */

import { join } from '@std/path';
import { bold, cyan, gray, green, red } from '@std/fmt/colors';
import { DEPLOY_DIRS } from '../../../../kernel/constants/runtime.ts';
import type { BuildResult } from '../../../../kernel/domain/deploy/compile-target.ts';
import type { ResolvedConfig } from '../../../../kernel/domain/resolved-config.ts';
import { buildCompileConfig } from '../../../../kernel/adapters/deploy/compile/compile-config.ts';
import {
  formatDuration,
  formatSize,
  printCompileResults,
} from '../../../../kernel/adapters/deploy/compile/compile-format.ts';
import { compileAll } from '../../../../kernel/adapters/deploy/compile/compile-runner.ts';
import { extractCompileTargets } from '../../../../kernel/adapters/deploy/compile/compile-targets.ts';
import {
  writeEnvFile,
  writeEnvTemplate,
} from '../../../../kernel/adapters/windows/environment/env-file-writer.ts';
import { writeServyConfigs } from '../../../../kernel/adapters/windows/servy/servy-writer.ts';
import { buildManifestContext } from '../../../../kernel/adapters/windows/manifest/manifest-resolver.ts';
import {
  generateServiceManifest,
  topologicalSort,
  writeServiceManifest,
} from '../../../../kernel/adapters/windows/manifest/manifest.ts';
import { printV8BudgetSummary } from '../../../../kernel/adapters/windows/runtime/v8-profiles.ts';
import { compileWindowsCli } from './build-windows-cli.ts';
import { copyWindowsTaskFiles } from './build-windows-tasks.ts';
import { runAppPrebuilds } from './build-windows-prebuild.ts';
import { writeWindowsRuntimeConfig } from './build-windows-runtime.ts';
import type { WindowsBuildOptions } from './build-windows-options.ts';
import { resolveInstallDir } from '../../../../kernel/adapters/runtime/platform/deno-platform.ts';

// ============================================================================
// BUILD PIPELINE
// ============================================================================

/**
 * Run the full build pipeline for Windows Services deployment.
 *
 * On success, the deploy directory contains:
 *   bin/              — compiled .exe binaries
 *   config/           — Servy XML + services.json + runtime/ scaffolding
 *   logs/             — empty log directory (created by Servy at runtime)
 *   .env              — complete environment file (deploy root)
 *   .env.template     — provider-agnostic template (deploy root)
 */
export async function buildWindowsDeployment(
  config: ResolvedConfig,
  options: WindowsBuildOptions,
): Promise<BuildResult> {
  const startTime = performance.now();

  const binDir = join(options.deployDir, DEPLOY_DIRS.BIN);
  const configDir = join(options.deployDir, DEPLOY_DIRS.CONFIG);
  const logsDir = join(options.deployDir, DEPLOY_DIRS.LOGS);
  const scriptsDir = join(options.deployDir, DEPLOY_DIRS.SCRIPTS);

  // Ensure directory structure
  await Promise.all([
    Deno.mkdir(binDir, { recursive: true }),
    Deno.mkdir(configDir, { recursive: true }),
    Deno.mkdir(logsDir, { recursive: true }),
    Deno.mkdir(scriptsDir, { recursive: true }),
  ]);

  const allExtractedTargets = extractCompileTargets(config);

  // Apply --skip filter: exclude targets whose name matches any skip pattern
  const skipSet = new Set(options.skipServices ?? []);
  const targets = skipSet.size > 0
    ? allExtractedTargets.filter((t) => !skipSet.has(t.name))
    : allExtractedTargets;

  if (skipSet.size > 0 && options.verbose) {
    const skipped = allExtractedTargets
      .filter((t) => skipSet.has(t.name))
      .map((t) => t.name);
    if (skipped.length > 0) {
      outputText(gray(`Skipping: ${skipped.join(', ')}`));
    }
  }

  const sortedTargets = topologicalSort(targets);

  // ── Build header ─────────────────────────────────────────────────────────
  outputText(bold(cyan('\nNetScript Windows Deployment Build')));
  outputText(gray('─'.repeat(55)));
  outputText(`Project:  ${config.name} v${config.version}`);
  outputText(`Targets:  ${targets.length} services to compile`);
  outputText(`Output:   ${options.deployDir}`);
  outputText(gray('─'.repeat(55)));

  if (options.verbose) {
    printV8BudgetSummary(targets);
  }

  const prebuildFailure = await runAppPrebuilds(config, options, binDir, startTime);
  if (prebuildFailure) {
    return prebuildFailure;
  }

  // ── Step 2: Compile ──────────────────────────────────────────────────────
  let buildResult: BuildResult;

  // Build the compile config once — used by both service compilation and CLI self-compile
  // (derives workspace from deno.json, applies nodeModulesDir: "none" for size reduction)
  const compileConfigContent = !options.skipCompile
    ? await buildCompileConfig(
      config.projectRoot,
      config.deploy.workspace,
      config.deploy.bundleExternalImports,
    )
    : '';

  if (options.skipCompile) {
    outputText(gray('⏭️  Skipping compilation (--skip-compile)'));
    buildResult = {
      success: true,
      outputDir: binDir,
      compilations: [],
      durationMs: 0,
      errors: [],
    };
  } else {
    outputText(bold('\n🔨 Compiling services to Windows executables...'));

    buildResult = await compileAll(sortedTargets, {
      projectRoot: config.projectRoot,
      binDir,
      target: config.deploy.compileTarget,
      timeoutMs: config.deploy.compileTimeoutMs,
      bundleTimeoutMs: config.deploy.bundleTimeoutMs,
      bundleExternal: config.deploy.bundleExternal,
      bundleExternalImports: config.deploy.bundleExternalImports,
      compileConfigContent,
      parallel: options.parallel,
      maxConcurrency: options.maxConcurrency ?? config.deploy.concurrency,
      verbose: options.verbose,
      onProgress: options.verbose ? undefined : (completed, total, name) => {
        // \r\x1b[K: return to column 0, then erase to end of line before
        // writing the new text — prevents leftover chars when a shorter
        // service name follows a longer one.
        Deno.stdout.writeSync(
          new TextEncoder().encode(
            `\r\x1b[K   [${completed}/${total}] Compiling ${name}...`,
          ),
        );
      },
    });

    if (!options.verbose && buildResult.compilations.length > 0) {
      // Erase the progress line and advance to a new line. The \n is required
      // on Windows PowerShell: without it, renderer output after writeSync
      // can stall until the user presses Enter (stdout not at line start).
      Deno.stdout.writeSync(new TextEncoder().encode('\r\x1b[K\n'));
    }

    if (options.verbose) {
      printCompileResults(buildResult.compilations);
    }

    if (!buildResult.success) {
      outputError(red('\n   Compilation failed:'));
      for (const err of buildResult.errors) {
        outputError(`   ${red('✗')} ${err}`);
      }
      return buildResult;
    }

    const successful = buildResult.compilations.filter((r) => r.success);
    const failed = buildResult.compilations.filter((r) => !r.success);
    const totalSize = successful.reduce((sum, r) => sum + r.sizeBytes, 0);

    outputText(
      `   Summary: ${successful.length}/${targets.length} compiled (${
        formatSize(totalSize)
      } total) — ${formatDuration(buildResult.durationMs)}`,
    );

    if (options.verbose) {
      // V8 memory budget summary
      const memoryBudget = targets.reduce((sum, t) => {
        const heapMb: Record<string, number> = {
          service: 256,
          plugin: 256,
          worker: 512,
          app: 128,
        };
        return sum + (heapMb[t.type] ?? 256);
      }, 0);
      const threadSavings = targets.length * 40;
      outputText('');
      outputText('   🧠 V8 Memory Optimization:');
      outputText(
        `      Total heap ceiling: ~${memoryBudget} MB across ${targets.length} services`,
      );
      outputText(
        `      Thread savings: ~${threadSavings} MB (--single-threaded eliminates 7 V8 threads/process)`,
      );
    }

    if (failed.length > 0) {
      outputText('');
      outputText('   ⚠ Failed compilations:');
      for (const f of failed) {
        outputText(`     - ${f.name}: ${f.error}`);
      }
    }
    outputText('');
  }

  await compileWindowsCli(config, options, scriptsDir);

  await copyWindowsTaskFiles(config, options, binDir);

  // ── Step 2: Generate Servy XML configs ───────────────────────────────────
  // The XMLs written here use the default install dir (resolveInstallDir with no override).
  // At install time, install.ts regenerates them in a temp dir with the actual target
  // machine's install dir before passing them to servy-cli.exe.
  outputText('📝 Generating Servy XML configurations...');

  // Build manifest context once — used by all targets for dynamic env var resolution.
  // Falls back to null gracefully if aspire-manifest.json is not present.
  const manifestCtx = await buildManifestContext(
    config.projectRoot,
    config.infrastructure,
    config.connectionStrings,
    sortedTargets,
  );

  const servyOptions = {
    installDir: resolveInstallDir(config.name),
    allTargets: sortedTargets,
    infrastructure: config.infrastructure,
    connectionStrings: config.connectionStrings,
    projectRoot: config.projectRoot,
    version: config.version,
    manifestCtx,
  };

  const xmlPaths = await writeServyConfigs(sortedTargets, configDir, servyOptions);

  if (options.verbose) {
    for (const target of sortedTargets) {
      outputText(`   ✓ ${target.name}.xml`);
    }
  }
  outputText(`   ${green('✓')} Generated ${xmlPaths.length} Servy XML configs`);
  outputText('');

  // ── Step 3: Service discovery manifest ───────────────────────────────────
  outputText('📋 Generating services.json manifest...');
  const manifest = generateServiceManifest(
    config.name,
    config.version,
    sortedTargets,
    config.infrastructure,
  );
  await writeServiceManifest(manifest, configDir);
  outputText(`   ${green('✓')} services.json`);
  outputText('');

  await writeWindowsRuntimeConfig(config, options, configDir);

  // ── Step 5: .env file ─────────────────────────────────────────────────────
  // IMPORTANT: Write to deployDir root, NOT configDir!
  // The standalone script writes .env to .deploy/windows/.env, and operators
  // expect to find it there. The deploy command copies it to installDir/.env.
  const shouldGenerateEnvFile = options.generateEnvFile ?? config.deploy.generateEnvFile;
  if (shouldGenerateEnvFile) {
    outputText('🔐 Generating environment files...');
    await writeEnvFile(
      options.deployDir, // deploy root, NOT configDir
      sortedTargets,
      config.infrastructure,
      config.connectionStrings,
      {
        version: config.version,
        installDir: resolveInstallDir(config.name),
        otlpEndpoint: config.infrastructure.otlpEndpoint,
      },
    );
    outputText(`   ${green('✓')} .env`);

    // Also write .env.template alongside .env
    await writeEnvTemplate(options.deployDir);
    outputText(`   ${green('✓')} .env.template`);
    outputText('');
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const totalDuration = performance.now() - startTime;

  outputText('════════════════════════════════════════════════════════════════');
  outputText(`${green('✅')} BUILD COMPLETE`);
  outputText('════════════════════════════════════════════════════════════════');
  outputText('');
  outputText(`Output directory: ${options.deployDir}`);
  outputText('');
  outputText('Next steps:');
  outputText(
    '  1. Review and update .deploy/windows/.env with your settings',
  );
  outputText(
    `  2. Run: netscript deploy copy   (sync artifacts to install dir)`,
  );
  outputText(
    `  3. Run: .deploy\\windows\\scripts\\netscript-cli.exe deploy install   (register services, requires admin)`,
  );
  outputText(
    `  4. Run: .deploy\\windows\\scripts\\netscript-cli.exe deploy start`,
  );
  outputText('');
  outputText(gray(`Total time: ${formatDuration(totalDuration)}`));
  outputText('');

  return { ...buildResult, durationMs: totalDuration };
}
