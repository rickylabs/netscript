import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { bold, green, red } from '@std/fmt/colors';
import { join } from '@std/path';
import type { BuildResult } from '../../../../kernel/domain/deploy/compile-target.ts';
import type { ResolvedConfig } from '../../../../kernel/domain/resolved-config.ts';
import type { WindowsBuildOptions } from './build-windows-options.ts';

export async function runAppPrebuilds(
  config: ResolvedConfig,
  options: WindowsBuildOptions,
  binDir: string,
  startTime: number,
): Promise<BuildResult | null> {
  // ── Step 1: Prebuild apps ────────────────────────────────────────────────
  // Run prebuild tasks (e.g. Fresh/Vite build) for enabled Deno apps that
  // define a prebuild step. This produces _fresh/compiled-entry.js and the
  // client bundle before deno compile packages them into a binary.
  if (!options.skipCompile) {
    const prebuildApps = Object.values(config.apps).filter(
      (app) => app.enabled && app.runtime === 'deno' && app.prebuild,
    );

    if (prebuildApps.length > 0) {
      outputText(bold('\n🏗️  Running app prebuild steps...'));

      for (const app of prebuildApps) {
        const taskName = app.prebuild!;
        const cwd = join(config.projectRoot, app.workdir);
        if (options.verbose) {
          outputText(`  [prebuild] deno task ${taskName} (cwd: ${app.workdir})`);
        }

        // Build VITE_* env vars for browser service discovery.
        // Mirrors Aspire's WithConfiguredViteHttpReferences — injects service
        // and plugin URLs so Vite bakes correct import.meta.env.* values.
        const viteEnv: Record<string, string> = {};
        for (const [name, svc] of Object.entries(config.services)) {
          const url = `http://localhost:${svc.port}`;
          // Full format — skip names with hyphens (invalid JS identifiers)
          if (!name.includes('-')) {
            viteEnv[`VITE_services__${name}__http__0`] = url;
          }
          // Shorthand: VITE_{NORMALISED}_URL (always safe, no hyphens)
          viteEnv[`VITE_${name.toUpperCase().replace(/-/g, '_')}_URL`] = url;
        }
        for (const [name, plugin] of Object.entries(config.plugins)) {
          if (!plugin.enabled) continue;
          const url = `http://localhost:${plugin.port}`;
          if (!name.includes('-')) {
            viteEnv[`VITE_services__${name}__http__0`] = url;
          }
          viteEnv[`VITE_${name.toUpperCase().replace(/-/g, '_')}_URL`] = url;
        }

        if (options.verbose) {
          const count = Object.keys(viteEnv).length;
          outputText(`  [prebuild] Injecting ${count} VITE_* service URL env vars`);
        }

        const cmd = new Deno.Command('deno', {
          args: ['task', taskName],
          cwd,
          stdin: 'null',
          stdout: options.verbose ? 'inherit' : 'piped',
          stderr: 'piped',
          env: { ...Deno.env.toObject(), ...viteEnv },
        });

        const output = await cmd.output();

        if (output.success) {
          outputText(`  ${green('✓')} ${app.name} (deno task ${taskName})`);
        } else {
          const stderr = new TextDecoder().decode(output.stderr).trim();
          outputError(`  ${red('✗')} ${app.name} prebuild failed: ${stderr || 'non-zero exit'}`);
          return {
            success: false,
            outputDir: binDir,
            compilations: [],
            durationMs: performance.now() - startTime,
            errors: [`Prebuild failed for ${app.name}: ${stderr || 'non-zero exit'}`],
          };
        }
      }
    }
  }
  return null;
}
