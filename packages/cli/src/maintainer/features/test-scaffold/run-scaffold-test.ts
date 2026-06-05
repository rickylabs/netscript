import type { ProcessPort } from '../../../kernel/ports/process-port.ts';

/** Output encodings supported by the scaffold E2E runner. */
export type ScaffoldTestFormat = 'pretty' | 'json' | 'ndjson';

/** Request for running one maintainer scaffold E2E suite. */
export interface RunScaffoldTestRequest {
  /** Repo root that owns the `e2e:cli` task. */
  readonly repoRoot: string;
  /** Suite suffix like `service` or full suite id like `scaffold.service`. */
  readonly fixture: string;
  /** Whether the E2E runner should clean up generated containers and files. */
  readonly cleanup?: boolean;
  /** Report format for the underlying suite runner. */
  readonly format?: ScaffoldTestFormat;
}

/** Result of one scaffold E2E suite run. */
export interface RunScaffoldTestResult {
  /** Fully qualified suite id passed to the runner. */
  readonly suiteId: string;
  /** Process exit code. */
  readonly code: number;
  /** Captured standard output. */
  readonly stdout: string;
  /** Captured standard error. */
  readonly stderr: string;
}

/** Dependencies used by the maintainer scaffold-test flow. */
export interface RunScaffoldTestDependencies {
  /** Process runner used to launch the repo-native E2E suite. */
  readonly process: ProcessPort;
}

/** Run one scaffold E2E suite through the repo-native `e2e:cli` task. */
export async function runScaffoldTest(
  request: RunScaffoldTestRequest,
  dependencies: RunScaffoldTestDependencies,
): Promise<RunScaffoldTestResult> {
  const suiteId = request.fixture.startsWith('scaffold.')
    ? request.fixture
    : `scaffold.${request.fixture}`;
  const args = ['task', 'e2e:cli', 'run', suiteId];

  if (request.cleanup) {
    args.push('--cleanup');
  }
  if (request.format) {
    args.push('--format', request.format);
  }

  const result = await dependencies.process.exec('deno', args, {
    cwd: request.repoRoot,
  });

  return { suiteId, ...result };
}
