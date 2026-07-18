import { join, resolve } from '@std/path';
import { DATABASE, PACKAGE_SOURCE, PLUGIN, REPORT_FORMAT } from './domain/extension-axes.ts';
import type { RunOptions } from './domain/run-context.ts';
import type { Reporter } from './ports/reporter.ts';
import type { SuiteRunner } from './application/runner/suite-runner.ts';
import { createSuiteRunner } from './application/runner/suite-runner.ts';
import { DenoCommandAdapter } from './adapters/commands/deno-command-adapter.ts';
import { DockerCliResourceCleaner } from './adapters/commands/docker-resource-cleaner.ts';
import { FetchHttpAdapter } from './adapters/http/fetch-http-adapter.ts';
import { CompositeReporter } from './adapters/reporting/composite-reporter.ts';
import { JsonReporter } from './adapters/reporting/json-reporter.ts';
import { LogFileReporter } from './adapters/reporting/log-file-reporter.ts';
import { NdjsonReporter } from './adapters/reporting/ndjson-reporter.ts';
import { PrettyReporter } from './adapters/reporting/pretty-reporter.ts';
import { ReportFileReporter } from './adapters/reporting/report-file-reporter.ts';
import { SystemClock } from './adapters/time/system-clock.ts';
import { DenoPlatform } from './adapters/platform/deno-platform.ts';
import { defaultCliEntrypoint } from './application/builders/workspace/workspace-options.ts';

function timestampName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `plugin-smoke-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${
    pad(date.getHours())
  }${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/** Create the production CLI runner with concrete adapters. */
export function createDefaultRunner(options: RunOptions): SuiteRunner {
  return createSuiteRunner({
    clock: new SystemClock(),
    commandExecutor: new DenoCommandAdapter(),
    httpClient: new FetchHttpAdapter(),
    dockerCleaner: new DockerCliResourceCleaner(),
    reporter: createReporter(options),
    platform: new DenoPlatform(),
  });
}

function createReporter(options: RunOptions): Reporter {
  const reporters: Reporter[] = [];
  if (options.format === 'pretty') reporters.push(new PrettyReporter());
  if (options.format === 'json') reporters.push(new JsonReporter());
  if (options.format === 'ndjson') reporters.push(new NdjsonReporter());
  if (options.logFile) reporters.push(new LogFileReporter(options.logFile));
  if (options.reportPath) reporters.push(new ReportFileReporter(options.reportPath));
  return new CompositeReporter(reporters);
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
    plugins: [PLUGIN.WORKER, PLUGIN.SAGA, PLUGIN.TRIGGER, PLUGIN.STREAM, PLUGIN.AUTH, PLUGIN.AI],
    samples: true,
    cleanup: false,
    format: REPORT_FORMAT.NDJSON,
    reportPath: undefined,
    logFile: join(repoRoot, '.llm', 'tmp', 'cli-e2e', `${projectName}.log`),
    commandTimeoutMs: 900_000,
    httpTimeoutMs: 30_000,
  };
}
