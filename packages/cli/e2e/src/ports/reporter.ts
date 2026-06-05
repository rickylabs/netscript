import type { RunReport, StepResult } from '../domain/report.ts';

/** Streaming report event. */
export type ReportEvent =
  | { readonly type: 'suite-start'; readonly suiteId: string }
  | { readonly type: 'gate-start'; readonly gateId: string; readonly title: string }
  | { readonly type: 'gate-end'; readonly result: StepResult }
  | { readonly type: 'suite-end'; readonly report: RunReport };

/** Reporter port used by the runner. */
export interface Reporter {
  emit(event: ReportEvent): Promise<void>;
}
