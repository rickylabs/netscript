import type { RunOptions } from '../../domain/run-context.ts';
import type { SuiteRunner } from '../../application/runner/suite-runner.ts';

/** CLI request after option mapping. */
export interface CliRunRequest {
  readonly suiteId: string;
  readonly gateId?: string;
  readonly overrides: Partial<RunOptions>;
}

/** Factory used by CLI commands to create a runner after options are resolved. */
export type CliRunnerFactory = (options: RunOptions) => SuiteRunner;
