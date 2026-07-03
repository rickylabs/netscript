import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { bold, green, red } from '@std/fmt/colors';
import { join } from '@std/path';
import type { ResolvedConfig } from '../../../../kernel/domain/resolved-config.ts';
import { buildCompileConfig } from '../../../../kernel/adapters/deploy/compile/compile-config.ts';
import { formatSize } from '../../../../kernel/adapters/deploy/compile/compile-format.ts';
import type { WindowsBuildOptions } from './build-windows-options.ts';

export async function compileWindowsCli(
  config: ResolvedConfig,
  options: WindowsBuildOptions,
  scriptsDir: string,
): Promise<void> {
  // ── Step 1b: CLI self-compile (bundle + compile, same pipeline as services) ──
  if (!options.skipCompile && (options.includeCli ?? true)) {
    outputText(bold('🔧 Compiling CLI to netscript-cli.exe...'));

    const cliEntrypoint = join(config.projectRoot, 'packages', 'cli', 'bin', 'netscript.ts');
    // Output to scripts/ — this is the binary operators use for start/stop/status/logs/uninstall.
    // It replaces the legacy PowerShell scripts that previously lived in this directory.
    const cliOutputPath = join(scriptsDir, 'netscript-cli');
    const cliBundlePath = join(config.projectRoot, '.bundle-netscript-cli.js');
    const cliConfigFilename = '.compile-netscript-cli.json';
    const cliConfigPath = join(config.projectRoot, cliConfigFilename);
    const cliEnvFilename = '.env-netscript-cli';
    const cliEnvFilePath = join(config.projectRoot, cliEnvFilename);

    // CLI is a short-lived command-line tool: single-threaded, small heap, no Sparkplug
    const cliV8Flags =
      '--v8-flags=--single-threaded,--optimize-for-size,--max-old-space-size=128,--no-sparkplug';

    const cliCleanup = async () => {
      try {
        await Deno.remove(cliBundlePath);
      } catch { /* ignore */ }
      try {
        await Deno.remove(cliConfigPath);
      } catch { /* ignore */ }
      try {
        await Deno.remove(cliEnvFilePath);
      } catch { /* ignore */ }
    };

    try {
      // Write a CLI-scoped compile config — workspace includes all packages/* so
      // transitive deps (e.g. packages/config needing @std/path) resolve correctly.
      // Excludes services/*/apps/*/plugins/workers/sagas/triggers — those are what
      // inflate the binary from ~90 MB to ~900 MB when the full root workspace is used.
      const cliCompileConfigContent = await buildCompileConfig(
        config.projectRoot,
        ['packages/*'],
        config.deploy.bundleExternalImports,
      );
      await Deno.writeTextFile(cliConfigPath, cliCompileConfigContent);

      // Bake the deploy root into the binary so operators don't need --deploy-dir.
      // options.deployDir is the resolved absolute output path passed to deploy build.
      const deployDirAbsolute = options.deployDir.startsWith('.')
        ? join(config.projectRoot, options.deployDir)
        : options.deployDir;
      await Deno.writeTextFile(cliEnvFilePath, `NETSCRIPT_DEPLOY_DIR=${deployDirAbsolute}\n`);

      // Step 1: Bundle — use packages/cli/deno.json directly so only CLI deps are
      // resolved. Using the workspace-wide temp config here inflates the bundle to
      // include all packages/* transitive deps, producing a ~900 MB binary.
      const cliPackageConfig = join(config.projectRoot, 'packages', 'cli', 'deno.json');
      const bundleCmd = new Deno.Command('deno', {
        args: [
          'bundle',
          `--config=${cliPackageConfig}`,
          '--no-lock',
          '--platform=deno',
          '--quiet',
          '--unstable-raw-imports',
          '--minify',
          `--output=${cliBundlePath}`,
          cliEntrypoint,
        ],
        cwd: config.projectRoot,
        stdin: 'null',
        stdout: 'null',
        stderr: 'piped',
      });

      const bundleResult = await bundleCmd.output();

      let compileFrom = cliEntrypoint;
      let usedBundle = false;

      if (bundleResult.success) {
        compileFrom = cliBundlePath;
        usedBundle = true;
        if (options.verbose) {
          try {
            const bundleStat = await Deno.stat(cliBundlePath);
            outputText(`   [bundle] ✓ ${formatSize(bundleStat.size)}`);
          } catch { /* ignore */ }
        }
      } else {
        const bundleErr = new TextDecoder().decode(bundleResult.stderr).trim();
        if (options.verbose) {
          outputText(`   [bundle] ✗ ${bundleErr.slice(0, 200)} — falling back to direct compile`);
        }
      }

      // Step 2: Compile bundle (or raw entrypoint as fallback)
      const compileCmd = new Deno.Command('deno', {
        args: [
          'compile',
          `--config=${cliConfigFilename}`,
          `--env-file=${cliEnvFilename}`,
          '--allow-all',
          '--quiet',
          '--no-lock',
          '--no-check',
          '--unstable-raw-imports',
          cliV8Flags,
          `--target=${config.deploy.compileTarget}`,
          `--output=${cliOutputPath}`,
          compileFrom,
        ],
        cwd: config.projectRoot,
        stdin: 'null',
        stdout: 'piped',
        stderr: 'piped',
      });

      const cliResult = await compileCmd.output();
      await cliCleanup();

      if (cliResult.success) {
        try {
          const stat = await Deno.stat(`${cliOutputPath}.exe`);
          const bundleNote = usedBundle ? '' : ' (no bundle)';
          outputText(`   ${green('✓')} netscript-cli.exe (${formatSize(stat.size)}${bundleNote})`);
        } catch {
          outputText(`   ${green('✓')} netscript-cli.exe`);
        }
      } else {
        const stderr = new TextDecoder().decode(cliResult.stderr);
        outputText(`   ${red('✗')} CLI compile failed: ${stderr.slice(0, 200)}`);
      }
    } catch (error: unknown) {
      await cliCleanup();
      const msg = error instanceof Error ? error.message : String(error);
      outputText(`   ${red('✗')} CLI compile error: ${msg}`);
    }

    outputText('');
  }
}
