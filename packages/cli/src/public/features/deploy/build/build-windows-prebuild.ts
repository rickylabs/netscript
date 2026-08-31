import { outputError, outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { buildViteEnvVarName } from '@netscript/aspire/application';
import { bold, green, red } from '@std/fmt/colors';
import { join } from '@std/path';
import type { BuildResult } from '../../../../kernel/domain/deploy/compile-target.ts';
import type {
  ResolvedConfig,
  ResolvedPluginConfig,
  ResolvedServiceConfig,
} from '../../../../kernel/domain/resolved-config.ts';
import type { WindowsBuildOptions } from './build-windows-options.ts';

/** Builds the browser service-discovery environment injected into app prebuilds. */
export function buildVitePrebuildEnvironment(
  services: Readonly<Record<string, Pick<ResolvedServiceConfig, 'port'>>>,
  plugins: Readonly<Record<string, Pick<ResolvedPluginConfig, 'enabled' | 'port'>>>,
): Record<string, string> {
  const viteEnv: Record<string, string> = {};
  for (const [name, service] of Object.entries(services)) {
    const url = `http://localhost:${service.port}`;
    const keys = buildViteEnvVarName(name);
    viteEnv[keys.full] = url;
    viteEnv[keys.shorthand] = url;
  }
  for (const [name, plugin] of Object.entries(plugins)) {
    if (!plugin.enabled) continue;
    const url = `http://localhost:${plugin.port}`;
    const keys = buildViteEnvVarName(name);
    viteEnv[keys.full] = url;
    viteEnv[keys.shorthand] = url;
  }
  return viteEnv;
}

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
        const viteEnv = buildVitePrebuildEnvironment(config.services, config.plugins);

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
