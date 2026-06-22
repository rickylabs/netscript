import { outputText } from '../../../presentation/output/default-output.ts';
/**
 * @module infra/windows/v8-profiles
 *
 * V8 heap and JIT configuration per service type.
 *
 * Profiles are tuned for Windows service deployments where multiple processes
 * share a single machine. Each profile balances startup latency, peak throughput,
 * and memory footprint for its workload type.
 */

import { DEFAULT_V8_HEAP_MB, NO_SPARKPLUG_FLAG } from '../../../constants/windows.ts';
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';

/**
 * Resolved V8 flags for a single service.
 */
export interface V8Profile {
  /** Service type */
  type: CompileTarget['type'];
  /** Max old-space heap in MB */
  maxOldSpaceMB: number;
  /** All V8 flags as a space-separated string (for display) */
  flags: string;
  /** All V8 flags as an array (for deno compile --v8-flags) */
  flagsArray: string[];
}

/**
 * Build the V8 flag array for a given service type.
 *
 * Base flags applied to all types:
 * - --optimize-for-size: prefers smaller JIT code output
 *
 * Per-type tuning:
 * - Services, plugins, apps: --single-threaded (eliminates 7 V8 worker threads,
 *   ~8-56 MB saved each), capped at 256/128 MB, no-sparkplug (reduces startup time
 *   for short-lived request handlers that don't benefit from Sparkplug JIT)
 * - Workers: NO --single-threaded (job pool uses worker threads for parallel execution),
 *   capped at 512 MB, full JIT (long-running, compute-heavy job execution)
 *
 * IMPORTANT: --max-semi-space-size CANNOT be combined with --max-old-space-size
 * (causes a fatal V8 assertion). --jitless is also unsafe because Prisma uses WASM.
 */
function buildV8FlagArray(type: CompileTarget['type']): string[] {
  const maxMB = DEFAULT_V8_HEAP_MB[type];
  const flags = [
    '--optimize-for-size',
    `--max-old-space-size=${maxMB}`,
  ];

  // Workers run a thread pool — --single-threaded would kill parallel job execution.
  // Services, plugins, and apps are single-request-at-a-time and benefit from the
  // thread reduction.
  if (type !== 'worker') {
    flags.unshift('--single-threaded');
  }

  if (type === 'service' || type === 'plugin' || type === 'app') {
    flags.push(NO_SPARKPLUG_FLAG);
  }

  return flags;
}

/**
 * Get the resolved V8 profile for a compile target.
 */
export function getV8Profile(target: Pick<CompileTarget, 'type'>): V8Profile {
  const flagsArray = buildV8FlagArray(target.type);
  return {
    type: target.type,
    maxOldSpaceMB: DEFAULT_V8_HEAP_MB[target.type],
    flags: flagsArray.join(' '),
    flagsArray,
  };
}

/**
 * Format V8 flags as a deno compile argument string.
 * e.g. `--v8-flags=--max-old-space-size=256,--no-sparkplug`
 */
export function formatV8CompileArg(profile: V8Profile): string {
  return `--v8-flags=${profile.flagsArray.join(',')}`;
}

/**
 * Format V8 flags as a DENO_V8_FLAGS environment variable value.
 * Used when running via `deno run` (not compiled binary).
 */
export function formatV8EnvVar(profile: V8Profile): string {
  return profile.flagsArray.join(' ');
}

/**
 * Print a V8 memory budget summary for all targets (verbose output).
 */
export function printV8BudgetSummary(targets: CompileTarget[]): void {
  outputText('\nV8 Memory Budget:');
  outputText('─'.repeat(50));

  const totals: Record<CompileTarget['type'], { count: number; mb: number }> = {
    service: { count: 0, mb: 0 },
    plugin: { count: 0, mb: 0 },
    worker: { count: 0, mb: 0 },
    app: { count: 0, mb: 0 },
  };

  for (const target of targets) {
    const profile = getV8Profile(target);
    const flags = profile.type === 'worker' ? '(full JIT)' : '(no-sparkplug)';
    outputText(
      `  ${target.name.padEnd(20)} ${String(profile.maxOldSpaceMB).padStart(4)} MB  ${flags}`,
    );
    totals[target.type].count++;
    totals[target.type].mb += profile.maxOldSpaceMB;
  }

  const totalMB = Object.values(totals).reduce((sum, { mb }) => sum + mb, 0);
  outputText('─'.repeat(50));
  outputText(`  Total estimate: ${totalMB} MB across ${targets.length} processes`);
  outputText('');
}
