import { outputText } from '../../../presentation/output/default-output.ts';
/** Run deno compile for one or more single-binary targets (OS-generic). */
import { join } from '@std/path';
import {
  DEFAULT_BUNDLE_EXTERNAL_IMPORTS,
  DEFAULT_COMPILE_TIMEOUT_MS,
} from '../../../constants/windows.ts';
import type {
  BuildResult,
  CompileResult,
  CompileTarget,
} from '../../../domain/deploy/compile-target.ts';
import { buildCompileConfig } from './compile-config.ts';
import { bundleTarget } from './compile-bundler.ts';
import { formatSize } from './compile-format.ts';
import { binaryExtensionForTarget, defaultCompileTarget } from './compile-platform.ts';
import { formatV8CompileArg, getV8Profile } from '../../windows/runtime/v8-profiles.ts';

// ============================================================================
// SINGLE TARGET COMPILATION
// ============================================================================

/**
 * Options for a single compilation run.
 */
export interface CompileOptions {
  /** Project root (used as cwd and for resolving relative entrypoints) */
  projectRoot: string;
  /** Output directory for .exe files */
  binDir: string;
  /** Compile target triple. Defaults to DEFAULT_COMPILE_TARGET. */
  target?: string;
  /** Per-service compile timeout in ms. Defaults to DEFAULT_COMPILE_TIMEOUT_MS. */
  timeoutMs?: number;
  /** Verbose deno output */
  verbose?: boolean;
  /** Pre-built compile config JSON (from buildCompileConfig). If omitted, built lazily. */
  compileConfigContent?: string;
  /** Packages to externalize during bundle. Defaults to DEFAULT_BUNDLE_EXTERNAL. */
  bundleExternal?: readonly string[];
  /** npm specifier rewrites for externalized packages. Defaults to DEFAULT_BUNDLE_EXTERNAL_IMPORTS. */
  bundleExternalImports?: Record<string, string>;
  /** Per-service bundle timeout in ms. Defaults to DEFAULT_BUNDLE_TIMEOUT_MS. */
  bundleTimeoutMs?: number;
}

/**
 * Compile a single target to a Windows .exe binary.
 *
 * Uses a two-step pipeline:
 *   1. `deno bundle` — tree-shakes npm packages into a single JS file,
 *      eliminating unused code (e.g. non-PostgreSQL Prisma WASM engines).
 *      Falls back to direct compile if bundling fails.
 *   2. `deno compile` — compiles the bundle (or raw entrypoint as fallback)
 *      into a standalone Windows binary.
 *
 * Embeds V8 flags appropriate to the service type.
 */
export async function compileTarget(
  target: CompileTarget,
  options: CompileOptions,
): Promise<CompileResult> {
  const startTime = performance.now();
  const arch = options.target ?? defaultCompileTarget();
  const outputPath = join(options.binDir, `${target.name}${binaryExtensionForTarget(arch)}`);
  const entrypointPath = join(options.projectRoot, target.entrypoint);
  const v8Profile = getV8Profile(target);
  const timeoutMs = options.timeoutMs ?? DEFAULT_COMPILE_TIMEOUT_MS;

  // ── Step 1: Bundle (tree-shake npm packages) ────────────────────────────
  let compileEntrypoint = entrypointPath;
  let bundlePath: string | undefined;

  const bundleResult = await bundleTarget(target, options);

  if ('bundlePath' in bundleResult) {
    compileEntrypoint = bundleResult.bundlePath;
    bundlePath = bundleResult.bundlePath;
    if (options.verbose) {
      outputText(`  [bundle] ✓ ${formatSize(bundleResult.bundleSizeBytes)}`);
    }
  } else if ('skip' in bundleResult) {
    if (options.verbose) {
      outputText(`  [bundle] skipped — ${bundleResult.skip}`);
    }
  } else {
    // Bundle failed — fall back to direct compile (larger binary but still works)
    if (options.verbose) {
      outputText(`  [bundle] ✗ ${bundleResult.error} — falling back to direct compile`);
    }
  }

  // ── Step 2: Compile ─────────────────────────────────────────────────────
  // Use the temp compile config (nodeModulesDir: "none") if it was written by
  // bundleTarget(), otherwise fall back to root deno.json.
  // "nodeModulesDir: none" is the key optimisation: it prevents deno compile
  // from embedding the entire node_modules directory (~280 MB) — instead only
  // modules reachable from the bundle entrypoint are included (~85 MB).
  // ── Ensure compile config exists ────────────────────────────────────────
  // bundleTarget() skips pre-built .js entrypoints (e.g. Fresh compiled-entry.js)
  // without writing the temp compile config. Write it now so deno compile uses
  // a filtered workspace (no other apps) instead of the root deno.json which
  // pulls all workspace members into the resolution graph.
  const compileConfigFilename = `.compile-${target.name}.json`;
  const compileConfigPath = join(options.projectRoot, compileConfigFilename);

  // Pre-built .js app entrypoints (e.g. Fresh compiled-entry.js) are already
  // tree-shaken by Vite — they don't need contracts/packages/plugins in the
  // workspace. Including them pulls npm: specifiers that fail with
  // nodeModulesDir: "none". Use a minimal workspace with only the app itself.
  // Always write for pre-built apps to avoid stale configs from previous runs.
  const isPrebuiltApp = target.type === 'app' && target.entrypoint.endsWith('.js');
  const configAlreadyExists = await Deno.stat(compileConfigPath).then(() => true, () => false);

  if (isPrebuiltApp || !configAlreadyExists) {
    try {
      const configContent = options.compileConfigContent ??
        (isPrebuiltApp
          ? await buildCompileConfig(
            options.projectRoot,
            [target.workdir],
            options.bundleExternalImports ?? DEFAULT_BUNDLE_EXTERNAL_IMPORTS,
          )
          : await buildCompileConfig(
            options.projectRoot,
            undefined,
            options.bundleExternalImports ?? DEFAULT_BUNDLE_EXTERNAL_IMPORTS,
            target.type === 'app' ? target.workdir : undefined,
          ));
      await Deno.writeTextFile(compileConfigPath, configContent);
    } catch {
      // Fall through — will use deno.json as fallback
    }
  }

  const compileConfigExists = await Deno.stat(compileConfigPath).then(() => true, () => false);
  const configFlag = compileConfigExists ? compileConfigFilename : 'deno.json';

  const includeFlags = (target.include ?? []).flatMap((p) => [
    '--include',
    join(options.projectRoot, p),
  ]);

  const args = [
    'compile',
    `--config=${configFlag}`,
    `--target=${arch}`,
    `--output=${outputPath}`,
    // --quiet suppresses the large VFS tree output that can hang the process
    '--quiet',
    // Bake V8 memory + threading flags into the binary
    formatV8CompileArg(v8Profile),
    // Enable raw import attributes (e.g. scalar.min.js used by some packages)
    '--unstable-raw-imports',
    // Skip the workspace lockfile — using deno.lock embeds ALL workspace npm
    // packages (~280 MB) instead of only those reachable from the entrypoint (~85 MB)
    '--no-lock',
    // Skip type-checking for bundles (plain JS) and app-type services
    // (Fresh/Vite use DOM types that fail strict deno compile checking)
    ...(bundlePath || target.type === 'app' ? ['--no-check'] : []),
    ...includeFlags,
    ...target.permissions,
    compileEntrypoint,
  ];

  if (options.verbose) {
    outputText(`  [compile] deno ${args.join(' ')}`);
  }

  const cleanup = async () => {
    if (bundlePath) {
      try {
        await Deno.remove(bundlePath);
      } catch { /* ignore */ }
    }
    // Clean up temp compile config (written by bundleTarget)
    try {
      await Deno.remove(compileConfigPath);
    } catch { /* ignore if not present */ }
  };

  const timeoutController = new AbortController();
  const timeoutHandle = setTimeout(() => timeoutController.abort(), timeoutMs);

  try {
    const cmd = new Deno.Command('deno', {
      args,
      cwd: options.projectRoot,
      stdin: 'null',
      stdout: options.verbose ? 'inherit' : 'piped',
      stderr: 'piped',
      signal: timeoutController.signal,
    });

    const output = await cmd.output();
    clearTimeout(timeoutHandle);

    // Clean up intermediate bundle and temp config files
    await cleanup();

    if (!output.success) {
      const stderr = new TextDecoder().decode(output.stderr).trim();
      return {
        name: target.name,
        success: false,
        outputPath,
        sizeBytes: 0,
        durationMs: performance.now() - startTime,
        error: stderr || 'Compilation failed with non-zero exit code',
      };
    }

    let sizeBytes = 0;
    try {
      sizeBytes = (await Deno.stat(outputPath)).size;
    } catch { /* binary may not be at expected path on partial failure */ }

    return {
      name: target.name,
      success: true,
      outputPath,
      sizeBytes,
      durationMs: performance.now() - startTime,
    };
  } catch (error) {
    clearTimeout(timeoutHandle);
    await cleanup();
    const isTimeout = error instanceof DOMException && error.name === 'AbortError';
    return {
      name: target.name,
      success: false,
      outputPath,
      sizeBytes: 0,
      durationMs: performance.now() - startTime,
      error: isTimeout
        ? `Timed out after ${timeoutMs}ms`
        : (error instanceof Error ? error.message : String(error)),
    };
  }
}

// ============================================================================
// BATCH COMPILATION
// ============================================================================

/**
 * Options for compiling multiple targets.
 */
export interface CompileAllOptions extends CompileOptions {
  /** Run compilations in parallel (default: true) */
  parallel?: boolean;
  /** Max concurrent compilations (default: 4) */
  maxConcurrency?: number;
  /** Progress callback: (completed, total, name) => void */
  onProgress?: (completed: number, total: number, name: string) => void;
}

async function compileSequential(
  targets: CompileTarget[],
  options: CompileAllOptions,
): Promise<CompileResult[]> {
  const results: CompileResult[] = [];
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    options.onProgress?.(i, targets.length, target.name);
    results.push(await compileTarget(target, options));
    options.onProgress?.(i + 1, targets.length, target.name);
  }
  return results;
}

async function compileParallel(
  targets: CompileTarget[],
  options: CompileAllOptions,
): Promise<CompileResult[]> {
  const concurrency = options.maxConcurrency ?? 4;
  const results: CompileResult[] = new Array(targets.length);
  let completed = 0;

  for (let i = 0; i < targets.length; i += concurrency) {
    const chunk = targets.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (target, chunkIdx) => {
        const result = await compileTarget(target, options);
        completed++;
        options.onProgress?.(completed, targets.length, target.name);
        return { index: i + chunkIdx, result };
      }),
    );
    for (const { index, result } of chunkResults) {
      results[index] = result;
    }
  }

  return results;
}

/**
 * Compile all targets and return aggregated results.
 */
export async function compileAll(
  targets: CompileTarget[],
  options: CompileAllOptions,
): Promise<BuildResult> {
  const startTime = performance.now();
  await Deno.mkdir(options.binDir, { recursive: true });

  const compilations = options.parallel !== false && targets.length > 1
    ? await compileParallel(targets, options)
    : await compileSequential(targets, options);

  const errors = compilations
    .filter((r) => !r.success)
    .map((r) => `${r.name}: ${r.error ?? 'unknown error'}`);

  return {
    success: errors.length === 0,
    outputDir: options.binDir,
    compilations,
    durationMs: performance.now() - startTime,
    errors,
  };
}
