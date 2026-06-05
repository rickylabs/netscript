/** Diagnostic entry produced by plugin doctor commands. */
export interface DoctorCheck {
  readonly name: string;
  readonly ok: boolean;
  readonly message?: string;
}

/** Aggregate doctor report for a plugin CLI. */
export interface DoctorReport {
  readonly plugin: string;
  readonly checks: readonly DoctorCheck[];
}

/** Return true when every doctor check is passing. */
export function isDoctorReportPassing(report: DoctorReport): boolean {
  return report.checks.every((check) => check.ok);
}
