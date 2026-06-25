import { join, resolve } from '@std/path';
import { DATABASE, PACKAGE_SOURCE, PLUGIN, REPORT_FORMAT } from '../../../domain/extension-axes.ts';
import type { RunOptions } from '../../../domain/run-context.ts';
import { defaultCliEntrypoint } from './workspace-options.ts';

function timestampName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `plugin-smoke-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${
    pad(date.getHours())
  }${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/** Build default run options from the current process. */
export function defaultRunOptions(overrides: Partial<RunOptions> = {}): RunOptions {
  const repoRoot = resolve('.');
  const projectName = timestampName();
  return {
    repoRoot,
    cliEntrypoint: defaultCliEntrypoint(repoRoot),
    smokeRoot: join(repoRoot, '.llm', 'tmp', 'cli-e2e'),
    projectName,
    database: DATABASE.POSTGRES,
    packageSource: overrides.packageSource ?? PACKAGE_SOURCE.LOCAL,
    plugins: [
      PLUGIN.WORKER,
      PLUGIN.SAGA,
      PLUGIN.TRIGGER,
      PLUGIN.STREAM,
      PLUGIN.AUTH,
    ],
    samples: true,
    cleanup: false,
    format: REPORT_FORMAT.NDJSON,
    reportPath: undefined,
    logFile: join(repoRoot, '.llm', 'tmp', 'cli-e2e', `${projectName}.log`),
    commandTimeoutMs: 900_000,
    httpTimeoutMs: 30_000,
  };
}
