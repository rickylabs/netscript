/** Diagnostic entry produced by plugin doctor commands. */
export interface DoctorCheck {
  /** Check name shown in doctor output. */
  readonly name: string;
  /** Whether the check passed. */
  readonly ok: boolean;
  /** Optional failure or warning message. */
  readonly message?: string;
}

/** Aggregate doctor report for a plugin CLI. */
export interface DoctorReport {
  /** Plugin name covered by the report. */
  readonly plugin: string;
  /** Checks included in the report. */
  readonly checks: readonly DoctorCheck[];
}

/** Return true when every doctor check is passing. */
export function isDoctorReportPassing(report: DoctorReport): boolean {
  return report.checks.every((check) => check.ok);
}
