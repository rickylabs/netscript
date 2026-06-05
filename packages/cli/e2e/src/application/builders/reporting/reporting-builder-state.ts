import type { ReportFormat } from '../../../domain/extension-axes.ts';

/** Reporting builder accumulator. */
export interface ReportingBuilderState {
  formats: ReportFormat[];
  reportPath?: string;
  logFile?: string;
}
