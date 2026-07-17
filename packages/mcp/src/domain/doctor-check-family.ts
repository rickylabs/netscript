import type { DoctorCheck, DoctorCounts, DoctorStatus } from './tool-contracts.ts';

/** Stable names for the doctor diagnostic families. */
export type DoctorFamilyName = 'telemetry' | 'aspire' | 'project' | 'plugins';

/** Context shared by doctor check families. */
export interface DoctorCheckContext {
  /** Project root whose NetScript wiring is inspected. */
  readonly projectRoot: string;
  /** Whether the caller explicitly asserted a telemetry endpoint. */
  readonly explicitTelemetryEndpoint: boolean;
}

/** One independently executable doctor check family. */
export interface DoctorCheckFamily {
  /** Stable family name. */
  readonly name: DoctorFamilyName;
  /** Run this family and return bounded checks. */
  check(context: DoctorCheckContext): Promise<readonly DoctorCheck[]>;
}

/** Aggregated result for one doctor family. */
export interface DoctorFamilyResult {
  /** Stable family name. */
  readonly name: DoctorFamilyName;
  /** Worst severity among this family's checks. */
  readonly status: DoctorStatus;
  /** Counts grouped by severity. */
  readonly counts: DoctorCounts;
  /** Bounded checks produced by the family. */
  readonly checks: readonly DoctorCheck[];
}

/** Rank a doctor status from least to most severe. */
export function doctorStatusRank(status: DoctorStatus): number {
  return status === 'pass' ? 0 : status === 'warn' ? 1 : 2;
}

/** Return the worst status in a list, treating an empty list as pass. */
export function worstDoctorStatus(checks: readonly DoctorCheck[]): DoctorStatus {
  return checks.reduce<DoctorStatus>(
    (worst, check) =>
      doctorStatusRank(check.status) > doctorStatusRank(worst) ? check.status : worst,
    'pass',
  );
}

/** Count checks by severity. */
export function countDoctorChecks(checks: readonly DoctorCheck[]): DoctorCounts {
  return checks.reduce<DoctorCounts>((counts, check) => ({
    ...counts,
    [check.status]: counts[check.status] + 1,
  }), { pass: 0, warn: 0, fail: 0 });
}
