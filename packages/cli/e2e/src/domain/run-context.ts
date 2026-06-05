import type { GateId, SuiteId } from './cli-surface.ts';
import type { DatabaseEngine, PackageSource, PluginKind, ReportFormat } from './extension-axes.ts';
import type { SmokeProject } from './smoke-project.ts';

/** User-facing run options accepted by the CLI and library runner. */
export interface RunOptions {
  readonly repoRoot: string;
  readonly cliEntrypoint: string;
  readonly smokeRoot: string;
  readonly projectName: string;
  readonly database: DatabaseEngine;
  readonly packageSource: PackageSource;
  readonly plugins: readonly PluginKind[];
  readonly samples: boolean;
  readonly cleanup: boolean;
  readonly format: ReportFormat;
  readonly reportPath?: string;
  readonly logFile?: string;
  readonly commandTimeoutMs: number;
  readonly httpTimeoutMs: number;
}

/** Normalized execution request. */
export interface RunRequest {
  readonly suiteId: SuiteId;
  readonly gateId?: GateId;
  readonly options: RunOptions;
}

/** Runtime context passed to gates. */
export interface RunContext {
  readonly request: RunRequest;
  readonly project: SmokeProject;
}
