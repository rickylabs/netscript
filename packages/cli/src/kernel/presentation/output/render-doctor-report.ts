import type { DoctorReport } from '@netscript/plugin/adapter';
import { outputText } from './default-output.ts';

/** Render existing diagnostic checks through the command's normal output sink. */
export function renderDoctorReport(
  report: DoctorReport | undefined,
  print: (message: string) => void = outputText,
): void {
  if (!report) return;
  for (const check of report.checks) {
    print(`${report.plugin}: ${check.name}: ${check.message ?? (check.ok ? 'OK' : 'failed')}`);
  }
}
