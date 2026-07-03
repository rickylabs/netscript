import { outputText } from '../../../presentation/output/default-output.ts';
/** Console formatting helpers for compile results. */
import type { CompileResult } from '../../../domain/deploy/compile-target.ts';

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/** Format bytes to a human-readable size string. */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Format milliseconds to a human-readable duration string. */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = ((ms % 60_000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

/**
 * Print a compilation result table to stdout.
 */
export function printCompileResults(results: CompileResult[]): void {
  const pad = (s: string, n: number) => s.padEnd(n);
  outputText('');
  outputText(`${'Service'.padEnd(24)} ${'Status'.padEnd(10)} ${'Size'.padEnd(12)} Duration`);
  outputText('─'.repeat(60));

  for (const r of results) {
    const status = r.success ? '✓ ok' : '✗ FAILED';
    const size = r.success ? formatSize(r.sizeBytes) : '-';
    const duration = formatDuration(r.durationMs);
    outputText(`${pad(r.name, 24)} ${pad(status, 10)} ${pad(size, 12)} ${duration}`);
    if (!r.success && r.error) {
      outputText(`  Error: ${r.error.split('\n')[0]}`);
    }
  }
  outputText('');
}
