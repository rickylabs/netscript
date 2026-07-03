import { outputText } from '../../../presentation/output/default-output.ts';
/** Bundle a TypeScript compile target before deno compile. */
import { join } from '@std/path';
import {
  DEFAULT_BUNDLE_EXTERNAL,
  DEFAULT_BUNDLE_EXTERNAL_IMPORTS,
  DEFAULT_BUNDLE_TIMEOUT_MS,
} from '../../../constants/windows.ts';
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';
import { buildCompileConfig } from './compile-config.ts';
import type { CompileOptions } from './compile-runner.ts';

// ============================================================================
// BUNDLE STEP
// ============================================================================

/**
 * Result of bundling a single target.
 */
type BundleResult =
  | { bundlePath: string; bundleSizeBytes: number }
  | { skip: string }
  | { error: string };

/**
 * Bundle a compile target's entrypoint into a single JS file via `deno bundle`.
 *
 * This is the key optimisation for binary size: `deno compile` embeds entire
 * npm package directories (e.g. all 74 MB of `@prisma/client` including WASM
 * for mysql/sqlite/sqlserver/cockroachdb even though only postgresql is
 * imported). `deno bundle` performs real file-level tree-shaking — the
 * generated bundle only contains the modules actually reachable from the
 * entrypoint.
 *
 * Measured impact: without bundle ~879 MB, with bundle ~97 MB per binary.
 *
 * App-type targets whose entrypoint is already a pre-built JS file
 * (e.g. Fresh 2's compiled-entry.js from Vite) are skipped — their
 * build tool already performed tree-shaking.
 *
 * A post-bundle fix patches esbuild's broken minified CJS shim back to
 * a `createRequire`-based form that works in Deno's ESM context.
 */
export async function bundleTarget(
  target: CompileTarget,
  options: CompileOptions,
): Promise<BundleResult> {
  const { projectRoot, verbose = false } = options;
  const bundleExternal = options.bundleExternal ?? DEFAULT_BUNDLE_EXTERNAL;
  const bundleExternalImports = options.bundleExternalImports ?? DEFAULT_BUNDLE_EXTERNAL_IMPORTS;
  const bundleTimeoutMs = options.bundleTimeoutMs ?? DEFAULT_BUNDLE_TIMEOUT_MS;

  // Skip pre-built JS entrypoints (e.g. Fresh 2 compiled-entry.js)
  if (target.entrypoint.endsWith('.js')) {
    return { skip: 'pre-built JS entrypoint (already tree-shaken)' };
  }

  const entrypointPath = join(projectRoot, target.entrypoint);
  const bundlePath = join(projectRoot, `.bundle-${target.name}.js`);
  // Use a per-target config filename so parallel compilations don't conflict.
  const compileConfigFilename = `.compile-${target.name}.json`;
  const compileConfigPath = join(projectRoot, compileConfigFilename);
  const externalFlags = [...bundleExternal].flatMap((pkg) => ['--external', pkg]);

  // Write the temp compile config (nodeModulesDir: "none", no apps/*, external imports).
  // Content is derived from root deno.json at runtime (via buildCompileConfig) or falls
  // back to the compiled-in COMPILE_CONFIG constant.
  const configContent = options.compileConfigContent ??
    await buildCompileConfig(projectRoot, undefined, bundleExternalImports);
  try {
    await Deno.writeTextFile(compileConfigPath, configContent);
  } catch {
    // If we can't write the config, fall back to root deno.json (larger binary)
    if (verbose) {
      outputText(`  [bundle] ⚠ could not write ${compileConfigFilename}, using deno.json`);
    }
  }

  const args = [
    'bundle',
    `--config=${compileConfigFilename}`,
    '--no-lock',
    '--platform=deno',
    '--quiet',
    '--unstable-raw-imports',
    '--minify',
    ...externalFlags,
    `--output=${bundlePath}`,
    entrypointPath,
  ];

  if (verbose) {
    outputText(`  [bundle] deno ${args.join(' ')}`);
  }

  const controller = new AbortController();
  const handle = setTimeout(() => controller.abort(), bundleTimeoutMs);

  try {
    const cmd = new Deno.Command('deno', {
      args,
      cwd: projectRoot,
      stdin: 'null',
      stdout: 'null',
      stderr: 'piped',
      signal: controller.signal,
    });

    const output = await cmd.output();
    clearTimeout(handle);

    if (!output.success) {
      const stderr = new TextDecoder().decode(output.stderr).trim();
      return { error: `Bundle failed: ${stderr || 'non-zero exit'}` };
    }

    // Post-bundle fixes: patch the bundle JS so deno compile can resolve it
    // using only --config=deno.json (no --import-map, which would displace
    // workspace member import maps and break subpath exports).
    try {
      let content = await Deno.readTextFile(bundlePath);
      let modified = false;

      // Fix 1: patch esbuild's broken minified CJS shim.
      // esbuild's minifier replaces the working `createRequire`-based CJS shim
      // with a `typeof require` polyfill that throws in Deno's ESM context.
      const shimRegex =
        /var\s+(\w+)\s*=\s*\(\w+=>\s*typeof\s+require\s*<\s*"u"\s*\?\s*require\s*:\s*typeof\s+Proxy\s*<\s*"u"[\s\S]*?is not supported'\)\s*\}\s*\)\s*;/;
      const shimMatch = content.match(shimRegex);
      if (shimMatch) {
        const varName = shimMatch[1];
        const fullShim = shimMatch[0];
        const replacement =
          `import{createRequire as __cr}from"node:module";var ${varName}=__cr(import.meta.url);`;
        content = content.substring(0, content.indexOf(fullShim)) +
          replacement +
          content.substring(content.indexOf(fullShim) + fullShim.length);
        modified = true;
        if (verbose) {
          outputText(
            `  [bundle] Fixed CJS shim: var ${varName} (${fullShim.length} → ${replacement.length} chars)`,
          );
        }
      }

      // Fix 2: replace bare external package specifiers with their npm: equivalents.
      // `deno bundle --external <pkg>` leaves `import "pkg"` bare in the output.
      // Rather than using --import-map (which overrides all workspace member import
      // maps and breaks subpath exports), we rewrite them directly in the bundle.
      for (const [pkg, npmSpecifier] of Object.entries(bundleExternalImports)) {
        // Match bare specifier in static imports (import ... from "pkg") and
        // dynamic imports (import("pkg")). Minified bundles have no spaces
        // between the import bindings and `from`, so \s* not \s+.
        const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const bareImport = new RegExp(
          `((?:import\\s*[^(][^;]*?from\\s*|import\\s*\\())(["'])${escaped}\\2`,
          'g',
        );
        const before = content;
        content = content.replace(bareImport, `$1$2${npmSpecifier}$2`);
        if (content !== before) modified = true;
      }

      if (modified) {
        await Deno.writeTextFile(bundlePath, content);
      }
    } catch { /* ignore fix failures — bundle still usable, compile may fail */ }

    let bundleSizeBytes = 0;
    try {
      bundleSizeBytes = (await Deno.stat(bundlePath)).size;
    } catch { /* ignore */ }

    return { bundlePath, bundleSizeBytes };
  } catch (error) {
    clearTimeout(handle);
    const isTimeout = error instanceof DOMException && error.name === 'AbortError';
    return {
      error: isTimeout
        ? `Bundle timed out after ${bundleTimeoutMs / 1000}s`
        : (error instanceof Error ? error.message : String(error)),
    };
  }
}
