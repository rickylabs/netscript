import { failDeployCommand } from '../../../../kernel/adapters/deploy/deploy-exit.ts';
import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
/**
 * @module commands/deploy/package-cli
 *
 * `netscript deploy package-cli` — compile the NetScript CLI itself into a
 * self-contained Windows .exe binary (no Deno runtime required on the target).
 *
 * Usage:
 *   netscript deploy package-cli [options]
 *
 * The resulting `netscript-cli.exe` can be shipped to any Windows deployment
 * target and used to run the operational deploy commands without Deno installed:
 *
 *   netscript-cli.exe deploy start  [service]
 *   netscript-cli.exe deploy stop   [service]
 *   netscript-cli.exe deploy status [service]
 *   netscript-cli.exe deploy logs   <service>
 *   netscript-cli.exe deploy uninstall [service]
 *
 * Build pipeline (mirrors how `deploy build` compiles services):
 *   1. Bundle  — deno bundle (tree-shake, minify, eliminate unused npm deps)
 *   2. Compile — deno compile (bundle → standalone .exe via v8_snapshot)
 *      Falls back to direct compile if bundle step fails.
 */

import { Command } from '@cliffy/command';
import { bold, cyan, gray, green, red } from '@std/fmt/colors';
import { join, resolve } from '@std/path';
import { ensureDir } from '@std/fs';
import { DEFAULT_COMPILE_TARGET } from '../../../../kernel/constants/windows.ts';
import { DEFAULT_DEPLOY_OUTPUT_DIR, DEPLOY_DIRS } from '../../../../kernel/constants/runtime.ts';
import { buildCompileConfig } from '../../../../kernel/adapters/windows/compile/compile-config.ts';
import { formatError } from '../../../../kernel/domain/errors.ts';

// ── V8 flags suited for a short-lived CLI process ───────────────────────────
const CLI_V8_FLAGS =
  '--v8-flags=--single-threaded,--optimize-for-size,--max-old-space-size=128,--no-sparkplug';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}

async function removeSilent(path: string): Promise<void> {
  try {
    await Deno.remove(path);
  } catch { /* ignore — file may not exist */ }
}

// ── Command ──────────────────────────────────────────────────────────────────

export const packageCliCommand = new Command()
  .name('package-cli')
  .description(
    'Compile the NetScript CLI into a self-shippable Windows .exe binary',
  )
  .option(
    '-o, --output-dir <dir:string>',
    'Output directory (scripts/ subdirectory is used)',
    { default: DEFAULT_DEPLOY_OUTPUT_DIR },
  )
  .option(
    '--target <triple:string>',
    'Deno compile target triple',
    { default: DEFAULT_COMPILE_TARGET },
  )
  .option(
    '--no-bundle',
    'Skip the bundle step (compile directly from source — larger output)',
  )
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    outputText(bold(cyan('NetScript CLI Packager')));
    outputText(gray('─'.repeat(55)));

    // Resolve paths
    const projectRoot = resolve(Deno.cwd());
    const outputDir = resolve(options.outputDir);
    const scriptsDir = join(outputDir, DEPLOY_DIRS.SCRIPTS);
    const cliEntrypoint = join(projectRoot, 'packages', 'cli', 'bin', 'netscript.ts');
    const cliOutputPath = join(scriptsDir, 'netscript-cli');
    const exePath = `${cliOutputPath}.exe`;

    // Temp artefacts written to project root (same CWD as deno compile)
    const cliBundlePath = join(projectRoot, '.bundle-netscript-cli.js');
    const cliConfigFilename = '.compile-netscript-cli.json';
    const cliConfigPath = join(projectRoot, cliConfigFilename);
    const cliEnvFilename = '.env-netscript-cli';
    const cliEnvFilePath = join(projectRoot, cliEnvFilename);

    const cleanup = async () => {
      await removeSilent(cliBundlePath);
      await removeSilent(cliConfigPath);
      await removeSilent(cliEnvFilePath);
    };

    outputText(`Entrypoint: ${cliEntrypoint}`);
    outputText(`Output:     ${exePath}`);
    outputText(`Target:     ${options.target}`);
    outputText(gray('─'.repeat(55)));

    try {
      await ensureDir(scriptsDir);

      // ── Step 1: Build a CLI-scoped compile config with nodeModulesDir: "none" ──
      // workspace includes all packages/* so transitive deps (e.g. packages/config
      // needing @std/path) resolve correctly.
      // Excludes services/*/apps/*/plugins/workers/sagas/triggers — those inflate
      // the binary from ~90 MB to ~900 MB when the full root workspace is used.
      const compileConfigContent = await buildCompileConfig(projectRoot, ['packages/*'], undefined);
      await Deno.writeTextFile(cliConfigPath, compileConfigContent);

      // Bake the deploy root into the binary — NETSCRIPT_DEPLOY_DIR is read by
      // resolveDefaultDeployDir() in shared.ts so operators don't need --deploy-dir.
      await Deno.writeTextFile(cliEnvFilePath, `NETSCRIPT_DEPLOY_DIR=${outputDir}\n`);

      // ── Step 2: Bundle (optional) ─────────────────────────────────────────
      let compileFrom = cliEntrypoint;
      let usedBundle = false;

      const doBundle = options.bundle !== false;

      if (doBundle) {
        if (options.verbose) {
          outputText(bold('\n[1/2] Bundling...'));
        } else {
          Deno.stdout.writeSync(new TextEncoder().encode('  [1/2] Bundling...'));
        }

        // Use packages/cli/deno.json directly for bundling — the temp compile
        // config scopes to packages/* for nodeModulesDir:"none" but that makes
        // the bundle pull in all packages/* transitive deps (~900 MB output).
        const cliPackageConfig = join(projectRoot, 'packages', 'cli', 'deno.json');
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
          cwd: projectRoot,
          stdin: 'null',
          stdout: options.verbose ? 'inherit' : 'null',
          stderr: 'piped',
        });

        const bundleResult = await bundleCmd.output();

        if (bundleResult.success) {
          compileFrom = cliBundlePath;
          usedBundle = true;
          const bundleStat = await Deno.stat(cliBundlePath).catch(() => null);
          const sizeNote = bundleStat ? ` (${formatSize(bundleStat.size)})` : '';
          if (options.verbose) {
            outputText(`   ${green('✓')} Bundle complete${sizeNote}`);
          } else {
            Deno.stdout.writeSync(
              new TextEncoder().encode(`\r\x1b[K  [1/2] Bundle${sizeNote} — done\n`),
            );
          }
        } else {
          const bundleErr = new TextDecoder().decode(bundleResult.stderr).trim();
          if (options.verbose) {
            outputText(
              `   ${gray('!')} Bundle failed (${
                bundleErr.slice(0, 200)
              }) — falling back to direct compile`,
            );
          } else {
            Deno.stdout.writeSync(
              new TextEncoder().encode('\r\x1b[K  [1/2] Bundle failed — falling back\n'),
            );
          }
        }
      } else {
        outputText(gray('  [1/2] Bundle skipped (--no-bundle)'));
      }

      // ── Step 3: Compile ───────────────────────────────────────────────────
      const compileStep = doBundle ? '[2/2]' : '[1/1]';
      if (options.verbose) {
        outputText(bold(`\n${compileStep} Compiling${usedBundle ? ' bundle' : ' source'}...`));
      } else {
        Deno.stdout.writeSync(
          new TextEncoder().encode(
            `  ${compileStep} Compiling${usedBundle ? ' bundle' : ' source'}...`,
          ),
        );
      }

      const compileArgs = [
        'compile',
        `--config=${cliConfigFilename}`,
        `--env-file=${cliEnvFilename}`,
        '--allow-all',
        '--quiet',
        '--no-lock',
        '--no-check',
        '--unstable-raw-imports',
        CLI_V8_FLAGS,
        `--target=${options.target}`,
        `--output=${cliOutputPath}`,
        compileFrom,
      ];

      if (options.verbose) {
        outputText(gray(`  deno ${compileArgs.join(' ')}`));
      }

      const compileCmd = new Deno.Command('deno', {
        args: compileArgs,
        cwd: projectRoot,
        stdin: 'null',
        stdout: options.verbose ? 'inherit' : 'null',
        stderr: 'piped',
      });

      const compileResult = await compileCmd.output();
      await cleanup();

      if (compileResult.success) {
        const stat = await Deno.stat(exePath).catch(() => null);
        const sizeNote = stat ? ` (${formatSize(stat.size)})` : '';
        const bundleNote = !usedBundle && doBundle ? ' — no bundle' : '';

        if (options.verbose) {
          outputText(`   ${green('✓')} Compile complete${sizeNote}`);
        } else {
          Deno.stdout.writeSync(
            new TextEncoder().encode(`\r\x1b[K  ${compileStep} Compile complete${sizeNote}\n`),
          );
        }

        outputText('');
        outputText(
          `${green('✓')} ${bold('netscript-cli.exe')}${sizeNote}${bundleNote}`,
        );
        outputText(`   ${gray(exePath)}`);
        outputText('');
        outputText('The binary includes the full deploy command suite:');
        outputText(
          `  ${cyan('netscript-cli.exe')} deploy start   [service]`,
        );
        outputText(
          `  ${cyan('netscript-cli.exe')} deploy stop    [service]`,
        );
        outputText(
          `  ${cyan('netscript-cli.exe')} deploy status  [service]`,
        );
        outputText(
          `  ${cyan('netscript-cli.exe')} deploy logs    <service>`,
        );
        outputText(
          `  ${cyan('netscript-cli.exe')} deploy uninstall [service]`,
        );
      } else {
        const stderr = new TextDecoder().decode(compileResult.stderr).trim();
        Deno.stdout.writeSync(new TextEncoder().encode('\r\x1b[K'));
        outputError(`${red('✗')} Compile failed:\n${stderr.slice(0, 500)}`);
        failDeployCommand('Deploy command failed.');
      }
    } catch (error: unknown) {
      await cleanup();
      outputError(`${red('✗')} package-cli failed: ${formatError(error)}`);
      failDeployCommand('Deploy command failed.');
    }
  });
