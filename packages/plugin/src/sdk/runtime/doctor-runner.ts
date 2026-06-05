import type { DoctorReport } from '../../cli/mod.ts';

/** Run plugin doctor checks and return an aggregate report. */
export function runDoctorReport(
  plugin: string,
  checks: DoctorReport['checks'],
): DoctorReport {
  return { plugin, checks };
}
