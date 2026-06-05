import { outputText } from '../../presentation/output/default-output.ts';
import { bold, gray, green, red } from '@std/fmt/colors';

export interface UpgradeStepResult {
  name: string;
  success: boolean;
  skipped: boolean;
  message: string;
  durationMs: number;
}

export function printUpgradeSummary(
  results: UpgradeStepResult[],
  totalMs: number,
): void {
  outputText('');
  outputText('════════════════════════════════════════════════════════════════');
  outputText(bold('   Upgrade Summary'));
  outputText('────────────────────────────────────────────────────────────────');

  for (const step of results) {
    const icon = step.skipped ? gray('○') : step.success ? green('✓') : red('✗');
    const duration = step.durationMs > 0 ? gray(` (${formatMs(step.durationMs)})`) : '';
    outputText(`   ${icon} ${step.name.padEnd(12)} ${step.message}${duration}`);
  }

  outputText('────────────────────────────────────────────────────────────────');

  const allOk = results.every((r) => r.success || r.skipped);
  if (allOk) {
    outputText(`   ${green('✅')} Upgrade complete! (${formatMs(totalMs)})`);
  } else {
    const failedSteps = results.filter((r) => !r.success && !r.skipped).map((r) => r.name);
    outputText(`   ${red('❌')} Upgrade finished with errors in: ${failedSteps.join(', ')}`);
  }

  outputText('════════════════════════════════════════════════════════════════');
  outputText('');
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = ((ms % 60_000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}
