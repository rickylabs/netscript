import type { RunOptions } from '../../../domain/run-context.ts';

/** Fluent builder for report output options. */
export interface ReportingBuilder {
  withPretty(): ReportingBuilder;
  withJson(): ReportingBuilder;
  withNdjson(): ReportingBuilder;
  withReport(path: string): ReportingBuilder;
  withLogFile(path: string): ReportingBuilder;
  buildOptions(): Pick<RunOptions, 'format' | 'reportPath' | 'logFile'>;
}

/** Create a reporting builder seeded by current run options. */
export function createReportingBuilder(initial: RunOptions): ReportingBuilder {
  let format = initial.format;
  let reportPath = initial.reportPath;
  let logFile = initial.logFile;
  return {
    withPretty() {
      format = 'pretty';
      return this;
    },
    withJson() {
      format = 'json';
      return this;
    },
    withNdjson() {
      format = 'ndjson';
      return this;
    },
    withReport(path) {
      reportPath = path;
      return this;
    },
    withLogFile(path) {
      logFile = path;
      return this;
    },
    buildOptions() {
      return { format, reportPath, logFile };
    },
  };
}
