/**
 * MCP-friendly full scaffold E2E smoke for CLI/plugin/DB/Aspire changes.
 *
 * This tool creates a fresh generated NetScript project, adds the official plugin suite in local
 * contributor mode, runs the DB init/generate/seed workflow, starts Aspire, calls real plugin
 * endpoints, triggers a worker job, and emits machine-readable step results.
 *
 * Examples:
 * - deno run --allow-read --allow-write --allow-run --allow-net --allow-env .llm/tools/e2e/scaffold-e2e-test.ts
 * - deno run --allow-read --allow-write --allow-run --allow-net --allow-env .llm/tools/e2e/scaffold-e2e-test.ts --format pretty --cleanup
 * - deno run --allow-read --allow-write --allow-run --allow-net --allow-env .llm/tools/e2e/scaffold-e2e-test.ts --repo . --name plugin-smoke-manual --strict-telemetry
 */

import { delay } from 'jsr:@std/async@1/delay';
import { ensureDir } from 'jsr:@std/fs@1/ensure-dir';
import { exists } from 'jsr:@std/fs@1/exists';
import { dirname, fromFileUrl, join, resolve } from 'jsr:@std/path@1';
import { Command } from 'jsr:@cliffy/command@1.0.0';

type OutputFormat = 'ndjson' | 'json' | 'pretty';
type StepKind = 'command' | 'http' | 'tcp' | 'sleep' | 'summary';
type StepStatus = 'passed' | 'failed' | 'warning' | 'skipped';

interface Options {
  repo: string;
  cli: string;
  smokeRoot: string;
  name: string;
  db: string;
  source: 'auto' | 'starter' | 'local';
  samples: boolean;
  cleanup: boolean;
  dryRun: boolean;
  skipTelemetry: boolean;
  strictTelemetry: boolean;
  format: OutputFormat;
  report?: string;
  logFile: string;
  progressIntervalMs: number;
  commandTimeoutMs: number;
  httpTimeoutMs: number;
  workersUrl: string;
  sagasUrl: string;
  triggersUrl: string;
  authUrl: string;
}

interface CommandOptionValues {
  repo?: string;
  cli?: string;
  smokeRoot?: string;
  name?: string;
  db?: string;
  source?: string;
  samples?: boolean;
  noSamples?: boolean;
  cleanup?: boolean;
  dryRun?: boolean;
  skipTelemetry?: boolean;
  strictTelemetry?: boolean;
  format?: string;
  report?: string;
  logFile?: string;
  progressIntervalMs?: number;
  commandTimeoutMs?: number;
  httpTimeoutMs?: number;
  workersUrl?: string;
  sagasUrl?: string;
  triggersUrl?: string;
  authUrl?: string;
}

interface CommandDetails {
  command: string[];
  cwd: string;
  exitCode?: number;
  stdoutTail?: string;
  stderrTail?: string;
  timedOut?: boolean;
}

interface HttpDetails {
  method: string;
  url: string;
  statusCode?: number;
  ok?: boolean;
  bodyPreview?: string;
  jsonSummary?: unknown;
  timedOut?: boolean;
}

interface TcpDetails {
  host: string;
  port: number;
  connected?: boolean;
  timedOut?: boolean;
}

interface StepResult {
  id: string;
  title: string;
  kind: StepKind;
  status: StepStatus;
  critical: boolean;
  durationMs: number;
  details?: CommandDetails | HttpDetails | TcpDetails | Record<string, unknown>;
  error?: string;
}

interface Report {
  ok: boolean;
  startedAspire: boolean;
  stoppedAspire: boolean;
  project: {
    repo: string;
    smokeRoot: string;
    name: string;
    root: string;
    appHost: string;
    stopCommand: string[];
    logFile: string;
  };
  options: {
    db: string;
    source: string;
    samples: boolean;
    cleanup: boolean;
    dryRun: boolean;
    skipTelemetry: boolean;
    strictTelemetry: boolean;
    format: OutputFormat;
    progressIntervalMs: number;
  };
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
    durationMs: number;
  };
  steps: StepResult[];
}

class SmokeFailure extends Error {
  constructor(readonly step: StepResult) {
    super(`Smoke step failed: ${step.id} (${step.title})`);
  }
}

const decoder = new TextDecoder();
function inferRepoRoot(): string {
  const toolPath = fromFileUrl(import.meta.url);
  return resolve(dirname(toolPath), '..', '..');
}

function timestampName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

function ensurePositiveInt(value: number, flag: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${flag} must be a positive integer, got "${value}"`);
  }
  return value;
}

function parseSourceMode(raw: string): Options['source'] {
  if (raw === 'auto' || raw === 'starter' || raw === 'local') {
    return raw;
  }
  throw new Error(`--source must be one of auto, starter, local; got "${raw}"`);
}

function parseFormat(raw: string): OutputFormat {
  if (raw === 'ndjson' || raw === 'json' || raw === 'pretty') {
    return raw;
  }
  throw new Error(`--format must be one of ndjson, json, pretty; got "${raw}"`);
}

function defaultOptions(): Options {
  const repo = inferRepoRoot();
  return {
    repo,
    cli: join(repo, 'packages', 'cli', 'bin', 'netscript-dev.ts'),
    smokeRoot: join(repo, '.llm', 'tmp', 'manual-scaffold-smoke'),
    name: `plugin-smoke-${timestampName()}`,
    db: 'postgres',
    source: 'local',
    samples: true,
    cleanup: false,
    dryRun: false,
    skipTelemetry: false,
    strictTelemetry: false,
    format: 'ndjson',
    logFile: join(repo, '.llm', 'tmp', 'scaffold-e2e-test', `plugin-smoke-${timestampName()}.log`),
    progressIntervalMs: 15_000,
    commandTimeoutMs: 900_000,
    httpTimeoutMs: 30_000,
    workersUrl: 'http://localhost:8091',
    sagasUrl: 'http://localhost:8092',
    triggersUrl: 'http://localhost:8093',
    authUrl: 'http://localhost:8094',
  };
}

function authSmokeEnv(): Record<string, string> {
  return {
    NETSCRIPT_AUTH_BACKEND: 'kv-oauth',
    NETSCRIPT_AUTH_CLIENT_ID: 'scaffold_runtime_smoke',
    NETSCRIPT_AUTH_CLIENT_SECRET: 'scaffold_runtime_smoke_secret',
    NETSCRIPT_AUTH_AUTHORIZATION_ENDPOINT: 'https://issuer.example.test/oauth/authorize',
    NETSCRIPT_AUTH_TOKEN_ENDPOINT: 'https://issuer.example.test/oauth/token',
    NETSCRIPT_AUTH_REDIRECT_URI: 'http://localhost:8094/api/v1/auth/callback',
    NETSCRIPT_AUTH_KV_OAUTH_KEY: 'BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=',
    NETSCRIPT_AUTH_ALLOW_INSECURE_REQUESTS: 'true',
  };
}

function authSmokeEnvLines(indent: string): string[] {
  return Object.entries(authSmokeEnv()).map(([key, value]) =>
    `${indent}await resource.withEnvironment(${JSON.stringify(key)}, ${JSON.stringify(value)});`
  );
}

function normalizeCommandOptions(raw: CommandOptionValues): Options {
  const defaults = defaultOptions();
  const repo = raw.repo ? resolve(raw.repo) : defaults.repo;
  const cli = raw.cli ? resolve(raw.cli) : join(repo, 'packages', 'cli', 'bin', 'netscript-dev.ts');
  const smokeRoot = raw.smokeRoot
    ? resolve(raw.smokeRoot)
    : join(repo, '.llm', 'tmp', 'manual-scaffold-smoke');
  const name = raw.name ?? defaults.name;

  return {
    repo,
    cli,
    smokeRoot,
    name,
    db: raw.db ?? defaults.db,
    source: parseSourceMode(raw.source ?? defaults.source),
    samples: !(raw.samples === false || raw.noSamples === true),
    cleanup: raw.cleanup === true,
    dryRun: raw.dryRun === true,
    skipTelemetry: raw.skipTelemetry === true,
    strictTelemetry: raw.strictTelemetry === true,
    format: parseFormat(raw.format ?? defaults.format),
    report: raw.report ? resolve(raw.report) : undefined,
    logFile: raw.logFile
      ? resolve(raw.logFile)
      : join(repo, '.llm', 'tmp', 'scaffold-e2e-test', `${name}.log`),
    progressIntervalMs: ensurePositiveInt(
      raw.progressIntervalMs ?? defaults.progressIntervalMs,
      '--progress-interval-ms',
    ),
    commandTimeoutMs: ensurePositiveInt(
      raw.commandTimeoutMs ?? defaults.commandTimeoutMs,
      '--command-timeout-ms',
    ),
    httpTimeoutMs: ensurePositiveInt(
      raw.httpTimeoutMs ?? defaults.httpTimeoutMs,
      '--http-timeout-ms',
    ),
    workersUrl: (raw.workersUrl ?? defaults.workersUrl).replace(/\/+$/, ''),
    sagasUrl: (raw.sagasUrl ?? defaults.sagasUrl).replace(/\/+$/, ''),
    triggersUrl: (raw.triggersUrl ?? defaults.triggersUrl).replace(/\/+$/, ''),
    authUrl: (raw.authUrl ?? defaults.authUrl).replace(/\/+$/, ''),
  };
}

async function parseCliOptions(args: string[]): Promise<Options | null> {
  let parsed: Options | null = null;
  await new Command()
    .name('scaffold-e2e-test')
    .version('1.0.0')
    .description('Run the full generated-project scaffold smoke for CLI/plugin/DB/Aspire changes.')
    .option('--repo <path:string>', 'NetScript repo root. Default: inferred from tool path.')
    .option(
      '--cli <path:string>',
      'CLI entrypoint. Default: <repo>/packages/cli/bin/netscript-dev.ts.',
    )
    .option(
      '--smoke-root <path:string>',
      'Parent directory for generated projects. Default: <repo>/.llm/tmp/manual-scaffold-smoke.',
    )
    .option('--name <name:string>', 'Generated project name. Default: plugin-smoke-<timestamp>.')
    .option('--db <engine:string>', 'DB engine/key for plugin DB provisioning.', {
      default: 'postgres',
    })
    .option('--source <mode:string>', 'Compatibility metadata; netscript-dev uses local sources.', {
      default: 'local',
    })
    .option('--samples', 'Include official sample tasks/jobs/sagas/triggers.', {
      default: true,
    })
    .option('--no-samples', 'Skip official sample tasks/jobs/sagas/triggers.')
    .option('--cleanup', 'Stop the generated Aspire AppHost before exit.', {
      default: false,
    })
    .option('--dry-run', 'Emit the planned steps without executing commands or HTTP calls.', {
      default: false,
    })
    .option('--skip-telemetry', 'Skip OTLP port and aspire otel checks.', {
      default: false,
    })
    .option('--strict-telemetry', 'Treat telemetry check failures as fatal.', {
      default: false,
    })
    .option('--format <mode:string>', 'Output mode: ndjson, json, pretty.', {
      default: 'ndjson',
    })
    .option('--report <path:string>', 'Also write the final JSON report to this path.')
    .option(
      '--log-file <path:string>',
      'Write a streaming progress log. Default: <repo>/.llm/tmp/scaffold-e2e-test/<name>.log.',
    )
    .option(
      '--progress-interval-ms <ms:integer>',
      'Heartbeat interval for long-running commands.',
      {
        default: 15_000,
      },
    )
    .option('--command-timeout-ms <ms:integer>', 'Per-command timeout in milliseconds.', {
      default: 900_000,
    })
    .option('--http-timeout-ms <ms:integer>', 'Per-request timeout in milliseconds.', {
      default: 30_000,
    })
    .option('--workers-url <url:string>', 'Workers API base URL.', {
      default: 'http://localhost:8091',
    })
    .option('--sagas-url <url:string>', 'Sagas API base URL.', {
      default: 'http://localhost:8092',
    })
    .option('--triggers-url <url:string>', 'Triggers API base URL.', {
      default: 'http://localhost:8093',
    })
    .option('--auth-url <url:string>', 'Auth API base URL.', {
      default: 'http://localhost:8094',
    })
    .example(
      'Default NDJSON run',
      'deno run --allow-read --allow-write --allow-run --allow-net --allow-env .llm/tools/e2e/scaffold-e2e-test.ts',
    )
    .example(
      'Pretty dry-run plan',
      'deno run --allow-read --allow-write --allow-run --allow-net --allow-env .llm/tools/e2e/scaffold-e2e-test.ts --dry-run --format pretty',
    )
    .action((options: CommandOptionValues) => {
      parsed = normalizeCommandOptions(options);
    })
    .parse(args);

  if (parsed === null) {
    return null;
  }
  return parsed;
}

function tail(text: string, maxLength = 8_000): string {
  return text.length <= maxLength ? text : text.slice(text.length - maxLength);
}

function unknownToMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function summarizeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return {
      type: 'array',
      length: value.length,
      first: value.length > 0 ? summarizeJson(value[0]) : undefined,
    };
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    const summary: Record<string, unknown> = { type: 'object', keys: keys.slice(0, 20) };
    for (const key of ['success', 'status', 'service', 'total', 'message', 'id', 'triggered']) {
      if (key in record) {
        summary[key] = record[key];
      }
    }
    if ('data' in record && record.data !== null && typeof record.data === 'object') {
      const data = record.data as Record<string, unknown>;
      summary.dataKeys = Object.keys(data).slice(0, 20);
      for (const key of ['total', 'message', 'jobsCreated', 'tasksCreated', 'jobId', 'triggered']) {
        if (key in data) {
          summary[`data.${key}`] = data[key];
        }
      }
    }
    return summary;
  }

  return value;
}

function createBaseStep(
  id: string,
  title: string,
  kind: StepKind,
  critical: boolean,
  startedAt: number,
): Omit<StepResult, 'status'> {
  return {
    id,
    title,
    kind,
    critical,
    durationMs: Math.round(performance.now() - startedAt),
  };
}

function formatDuration(durationMs: number): string {
  if (durationMs < 1_000) {
    return `${durationMs}ms`;
  }
  const seconds = Math.round(durationMs / 1_000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${String(rest).padStart(2, '0')}s`;
}

function statusLabel(status: StepStatus): string {
  switch (status) {
    case 'passed':
      return 'PASS';
    case 'failed':
      return 'FAIL';
    case 'warning':
      return 'WARN';
    case 'skipped':
      return 'SKIP';
  }
}

function compactDetails(details: StepResult['details']): Record<string, unknown> | undefined {
  if (!details) {
    return undefined;
  }
  const record = details as Record<string, unknown>;
  if ('command' in record) {
    return {
      cwd: record.cwd,
      command: Array.isArray(record.command) ? record.command.join(' ') : record.command,
      exitCode: record.exitCode,
      timedOut: record.timedOut,
    };
  }
  if ('url' in record) {
    return {
      method: record.method,
      url: record.url,
      statusCode: record.statusCode,
      ok: record.ok,
      timedOut: record.timedOut,
    };
  }
  return record;
}

function prettyStepExtra(step: StepResult): string {
  const details = step.details as Record<string, unknown> | undefined;
  if (!details) {
    return '';
  }
  if (typeof details.exitCode === 'number') {
    return ` (exit ${details.exitCode})`;
  }
  if (typeof details.statusCode === 'number') {
    return ` (HTTP ${details.statusCode})`;
  }
  if (details.connected === true) {
    return ' (connected)';
  }
  return '';
}

function printPrettySummary(report: Report): void {
  const rows = [
    ['status', report.ok ? 'passed' : 'failed'],
    ['duration', formatDuration(report.summary.durationMs)],
    ['passed', String(report.summary.passed)],
    ['failed', String(report.summary.failed)],
    ['warnings', String(report.summary.warnings)],
    ['skipped', String(report.summary.skipped)],
    ['project', report.project.root],
    ['log', report.project.logFile],
  ];
  const labelWidth = Math.max(...rows.map(([label]) => label.length));

  console.log('\nSummary');
  for (const [label, value] of rows) {
    console.log(`  ${label.padEnd(labelWidth)}  ${value}`);
  }

  const failed = report.steps.filter((step) => step.status === 'failed');
  if (failed.length > 0) {
    console.log('\nFailures');
    for (const step of failed) {
      console.log(`  ${step.id} - ${step.error ?? step.title}`);
    }
  }
}

async function withTimeout<T>(
  timeoutMs: number,
  action: (signal: AbortSignal) => Promise<T>,
): Promise<{ value?: T; timedOut: boolean }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return { value: await action(controller.signal), timedOut: false };
  } catch (error: unknown) {
    if (controller.signal.aborted) {
      return { timedOut: true };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

class SmokeRunner {
  readonly #options: Options;
  readonly #steps: StepResult[] = [];
  #startedAspire = false;
  #stoppedAspire = false;

  constructor(options: Options) {
    this.#options = options;
  }

  #appendLog(message: string): void {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    Deno.mkdirSync(dirname(this.#options.logFile), { recursive: true });
    Deno.writeTextFileSync(this.#options.logFile, line, { append: true, create: true });
  }

  #initializeLog(): void {
    Deno.mkdirSync(dirname(this.#options.logFile), { recursive: true });
    Deno.writeTextFileSync(
      this.#options.logFile,
      [
        `NetScript scaffold E2E smoke`,
        `started=${new Date().toISOString()}`,
        `repo=${this.#options.repo}`,
        `project=${this.projectRoot}`,
        `db=${this.#options.db}`,
        `source=${this.#options.source}`,
        `samples=${this.#options.samples}`,
        '',
      ].join('\n'),
    );
  }

  #emitStart(step: {
    id: string;
    title: string;
    kind: StepKind;
    critical: boolean;
    details?: Record<string, unknown>;
  }): void {
    if (this.#options.format === 'pretty') {
      console.log(`\n[RUN ] ${step.id} - ${step.title}`);
      const details = step.details;
      if (details?.command) {
        console.log(`       cwd: ${details.cwd}`);
        console.log(`       cmd: ${details.command}`);
      } else if (details?.url) {
        console.log(`       ${details.method} ${details.url}`);
      }
    } else if (this.#options.format === 'ndjson') {
      console.log(JSON.stringify({ event: 'step-start', step }));
    }

    this.#appendLog(`START ${step.id} (${step.kind}, critical=${step.critical}) ${step.title}`);
    if (step.details) {
      this.#appendLog(`DETAIL ${step.id} ${JSON.stringify(step.details)}`);
    }
  }

  #emitProgress(id: string, title: string, elapsedMs: number): void {
    const message = `${id} still running after ${formatDuration(elapsedMs)} - ${title}`;
    if (this.#options.format === 'pretty') {
      console.log(`[....] ${message}`);
    } else if (this.#options.format === 'ndjson') {
      console.log(JSON.stringify({ event: 'step-progress', id, title, elapsedMs }));
    }
    this.#appendLog(`PROGRESS ${message}`);
  }

  #emitEnd(step: StepResult): void {
    const label = statusLabel(step.status);
    if (this.#options.format === 'pretty') {
      const suffix = step.error ? ` - ${step.error}` : '';
      console.log(
        `[${label}] ${step.id} ${formatDuration(step.durationMs)}${prettyStepExtra(step)}${suffix}`,
      );
      const details = compactDetails(step.details);
      if (details && (step.status === 'failed' || step.status === 'warning')) {
        console.log(`       ${JSON.stringify(details)}`);
      }
    } else if (this.#options.format === 'ndjson') {
      console.log(JSON.stringify({ event: 'step', step }));
    }

    this.#appendLog(
      `END ${label} ${step.id} ${formatDuration(step.durationMs)} ${step.error ?? ''}`.trimEnd(),
    );
    if (step.details) {
      this.#appendLog(`RESULT ${step.id} ${JSON.stringify(step.details, null, 2)}`);
    }
  }

  get projectRoot(): string {
    return join(this.#options.smokeRoot, this.#options.name);
  }

  get appHost(): string {
    return join(this.projectRoot, 'aspire', 'apphost.mts');
  }

  get stopCommand(): string[] {
    return ['aspire', 'stop', '--apphost', this.appHost, '--non-interactive', '--nologo'];
  }

  async run(): Promise<Report> {
    const startedAt = performance.now();
    this.#initializeLog();

    try {
      await this.#preflight();
      await this.#scaffoldProject();
      await this.#addPlugins();
      await this.#validateGeneratedProject();
      await this.#runDbWorkflow();
      await this.#typeCheckGeneratedProject();
      await this.#startAspire();
      await this.#waitForResources();
      await this.#inspectRuntime();
      await this.#exerciseApis();
      await this.#runPluginVerifier();
      await this.#checkTelemetry();
    } catch (error: unknown) {
      if (!(error instanceof SmokeFailure)) {
        this.#record({
          id: 'unexpected-error',
          title: 'Unexpected tool error',
          kind: 'summary',
          status: 'failed',
          critical: true,
          durationMs: 0,
          error: unknownToMessage(error),
        });
      }
    } finally {
      if (this.#options.cleanup && this.#startedAspire && !this.#options.dryRun) {
        await this.#cleanupAspire();
      }
    }

    const report = this.#buildReport(Math.round(performance.now() - startedAt));
    this.#appendLog(
      `SUMMARY ok=${report.ok} passed=${report.summary.passed} failed=${report.summary.failed} warnings=${report.summary.warnings} skipped=${report.summary.skipped}`,
    );
    if (this.#options.report) {
      await ensureDir(dirname(this.#options.report));
      await Deno.writeTextFile(this.#options.report, `${JSON.stringify(report, null, 2)}\n`);
    }
    return report;
  }

  #record(step: StepResult): StepResult {
    this.#steps.push(step);
    this.#emitEnd(step);
    if (step.critical && step.status === 'failed') {
      throw new SmokeFailure(step);
    }
    return step;
  }

  #commandArgs(...args: string[]): string[] {
    return ['run', '-A', this.#options.cli, ...args];
  }

  async #preflight(): Promise<void> {
    await this.#ensureExists('preflight-repo', 'Repo root exists', this.#options.repo);
    await this.#ensureExists('preflight-cli', 'CLI entrypoint exists', this.#options.cli);
    await this.#runCommand({
      id: 'preflight-deno-version',
      title: 'Deno is available',
      cwd: this.#options.repo,
      command: ['deno', '--version'],
    });
    await this.#runCommand({
      id: 'preflight-aspire-version',
      title: 'Aspire CLI is available',
      cwd: this.#options.repo,
      command: ['aspire', '--version'],
    });
    await this.#runCommand({
      id: 'preflight-no-running-apphost',
      title: 'List running Aspire AppHosts',
      cwd: this.#options.repo,
      command: ['aspire', 'ps', '--format', 'Json'],
      critical: false,
    });
  }

  async #ensureExists(id: string, title: string, path: string): Promise<void> {
    const startedAt = performance.now();
    this.#emitStart({
      id,
      title,
      kind: 'summary',
      critical: true,
      details: { path },
    });
    const pathExists = await exists(path);
    this.#record({
      ...createBaseStep(id, title, 'summary', true, startedAt),
      status: pathExists ? 'passed' : 'failed',
      details: { path },
      error: pathExists ? undefined : `Path does not exist: ${path}`,
    });
  }

  async #scaffoldProject(): Promise<void> {
    if (!this.#options.dryRun) {
      await ensureDir(this.#options.smokeRoot);
    }
    await this.#runCommand({
      id: 'init-project',
      title: 'Scaffold fresh DB-less local project',
      cwd: this.#options.repo,
      command: [
        'deno',
        ...this.#commandArgs(
          'init',
          this.#options.name,
          '--ci',
          '--path',
          this.#options.smokeRoot,
          '--db',
          'none',
          '--service',
          '--service-name',
          'users',
          '--service-port',
          '3001',
          '--app-name',
          'web',
          '--editor',
          'none',
          '--no-git',
        ),
      ],
    });
  }

  async #addPlugins(): Promise<void> {
    const sampleFlag = this.#options.samples ? '--samples' : '--no-samples';
    const plugins: Array<{ id: string; kind: string; name: string; args: string[] }> = [
      {
        id: 'plugin-add-workers',
        kind: 'worker',
        name: 'workers',
        args: ['--db', this.#options.db, sampleFlag],
      },
      { id: 'plugin-add-sagas', kind: 'saga', name: 'sagas', args: [sampleFlag] },
      { id: 'plugin-add-triggers', kind: 'trigger', name: 'triggers', args: [sampleFlag] },
      { id: 'plugin-add-streams', kind: 'stream', name: 'streams', args: [sampleFlag] },
      { id: 'plugin-add-auth', kind: 'auth', name: 'auth', args: [sampleFlag] },
    ];

    for (const plugin of plugins) {
      await this.#runCommand({
        id: plugin.id,
        title: `Add ${plugin.name} official plugin`,
        cwd: this.projectRoot,
        command: [
          'deno',
          ...this.#commandArgs(
            'plugin',
            'add',
            plugin.kind,
            '--name',
            plugin.name,
            ...plugin.args,
            '--project-root',
            '.',
            '--force',
          ),
        ],
      });
    }
  }

  async #validateGeneratedProject(): Promise<void> {
    await this.#runCommand({
      id: 'plugin-list',
      title: 'List configured plugins',
      cwd: this.projectRoot,
      command: ['deno', ...this.#commandArgs('plugin', 'list', '--project-root', '.')],
    });
  }

  async #runDbWorkflow(): Promise<void> {
    await this.#runCommand({
      id: 'aspire-restore',
      title: 'Restore Aspire TypeScript SDK modules',
      cwd: join(this.projectRoot, 'aspire'),
      command: ['aspire', 'restore'],
    });
    await this.#runCommand({
      id: 'db-init',
      title: 'Create and apply initial migration',
      cwd: this.projectRoot,
      command: [
        'deno',
        ...this.#commandArgs(
          'db',
          'init',
          '--db',
          this.#options.db,
          '--name',
          'init',
          '--project-root',
          '.',
        ),
      ],
    });
    await this.#runCommand({
      id: 'db-generate',
      title: 'Generate Prisma client and Zod schemas',
      cwd: this.projectRoot,
      command: [
        'deno',
        ...this.#commandArgs('db', 'generate', '--db', this.#options.db, '--project-root', '.'),
      ],
    });
    await this.#runCommand({
      id: 'db-seed',
      title: 'Seed database',
      cwd: this.projectRoot,
      command: [
        'deno',
        ...this.#commandArgs('db', 'seed', '--db', this.#options.db, '--project-root', '.'),
      ],
    });
    await this.#runCommand({
      id: 'db-status-after-init',
      title: 'Check DB migration status after init',
      cwd: this.projectRoot,
      command: [
        'deno',
        ...this.#commandArgs('db', 'status', '--db', this.#options.db, '--project-root', '.'),
      ],
    });
    await this.#runCommand({
      id: 'generate-plugin-registry',
      title: 'Generate plugin registry',
      cwd: this.projectRoot,
      command: ['deno', ...this.#commandArgs('generate', 'plugins', '--project-root', '.')],
    });
    await this.#validateAuthGeneratedWiring();
    await this.#configureAuthSmokeEnvironment();
  }

  async #validateAuthGeneratedWiring(): Promise<void> {
    await this.#ensureExists(
      'auth-plugin-copied-manifest',
      'Auth plugin manifest copied into generated workspace',
      join(this.projectRoot, 'plugins', 'auth', 'scaffold.plugin.json'),
    );
    await this.#ensureExists(
      'auth-plugin-copied-prisma',
      'Auth plugin Prisma schema copied into generated workspace',
      join(this.projectRoot, 'plugins', 'auth', 'database', 'auth.prisma'),
    );
    await this.#ensureExists(
      'auth-db-contribution-generated',
      'Auth Prisma contribution generated into database schema folder',
      join(this.projectRoot, 'database', 'postgres', 'schema', 'plugins', 'auth', 'auth.prisma'),
    );
  }

  async #configureAuthSmokeEnvironment(): Promise<void> {
    const startedAt = performance.now();
    const helperPath = join(this.projectRoot, 'aspire', '.helpers', 'register-plugins.mts');
    this.#emitStart({
      id: 'auth-smoke-env',
      title: 'Wire auth smoke environment into generated Aspire helper',
      kind: 'summary',
      critical: true,
      details: { path: helperPath },
    });

    if (this.#options.dryRun) {
      this.#record({
        ...createBaseStep(
          'auth-smoke-env',
          'Wire auth smoke environment into generated Aspire helper',
          'summary',
          true,
          startedAt,
        ),
        status: 'skipped',
        details: { path: helperPath },
      });
      return;
    }

    try {
      const source = await Deno.readTextFile(helperPath);
      const marker = '  // --- auth ---';
      const markerIndex = source.indexOf(marker);
      if (markerIndex < 0) {
        this.#record({
          ...createBaseStep(
            'auth-smoke-env',
            'Wire auth smoke environment into generated Aspire helper',
            'summary',
            true,
            startedAt,
          ),
          status: 'failed',
          details: { path: helperPath },
          error: 'Generated register-plugins.mts does not contain the auth resource block.',
        });
        return;
      }

      const bootstrapLine =
        "    await resource.withEnvironment('NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE', bootstrapModule);";
      const bootstrapIndex = source.indexOf(bootstrapLine, markerIndex);
      if (bootstrapIndex < 0) {
        this.#record({
          ...createBaseStep(
            'auth-smoke-env',
            'Wire auth smoke environment into generated Aspire helper',
            'summary',
            true,
            startedAt,
          ),
          status: 'failed',
          details: { path: helperPath },
          error: 'Generated auth resource block does not contain the bootstrap environment line.',
        });
        return;
      }

      const insertAt = bootstrapIndex + bootstrapLine.length;
      const updated = [
        source.slice(0, insertAt),
        '\n',
        ...authSmokeEnvLines('    ').map((line) => `${line}\n`),
        source.slice(insertAt),
      ].join('');
      await Deno.writeTextFile(helperPath, updated);
      this.#record({
        ...createBaseStep(
          'auth-smoke-env',
          'Wire auth smoke environment into generated Aspire helper',
          'summary',
          true,
          startedAt,
        ),
        status: 'passed',
        details: { path: helperPath },
      });
    } catch (error: unknown) {
      this.#record({
        ...createBaseStep(
          'auth-smoke-env',
          'Wire auth smoke environment into generated Aspire helper',
          'summary',
          true,
          startedAt,
        ),
        status: 'failed',
        details: { path: helperPath },
        error: unknownToMessage(error),
      });
    }
  }

  async #typeCheckGeneratedProject(): Promise<void> {
    await this.#runCommand({
      id: 'deno-check-generated-workspaces',
      title: 'Type-check generated packages/plugins/background/services/database',
      cwd: this.projectRoot,
      command: [
        'deno',
        'check',
        '--unstable-kv',
        './packages',
        './plugins',
        './workers',
        './sagas',
        './triggers',
        './services',
        './database',
      ],
    });
  }

  async #startAspire(): Promise<void> {
    await this.#runCommand({
      id: 'aspire-start',
      title: 'Start generated Aspire AppHost',
      cwd: this.projectRoot,
      command: [
        'aspire',
        'start',
        '--apphost',
        this.appHost,
        '--isolated',
        '--non-interactive',
        '--nologo',
      ],
      env: authSmokeEnv(),
    });
    this.#startedAspire = !this.#options.dryRun;
  }

  async #waitForResources(): Promise<void> {
    const resources = [
      'postgres',
      'garnet',
      'workers-api',
      'workers',
      'sagas-api',
      'sagas',
      'triggers-api',
      'triggers',
      'auth',
    ];

    for (const resource of resources) {
      await this.#runCommand({
        id: `aspire-wait-${resource}`,
        title: `Wait for Aspire resource ${resource}`,
        cwd: this.projectRoot,
        command: [
          'aspire',
          'wait',
          resource,
          '--apphost',
          this.appHost,
          '--non-interactive',
          '--nologo',
        ],
      });
    }
  }

  async #inspectRuntime(): Promise<void> {
    await this.#runCommand({
      id: 'aspire-describe',
      title: 'Describe generated Aspire topology',
      cwd: this.projectRoot,
      command: ['aspire', 'describe', '--apphost', this.appHost],
    });
    await this.#runCommand({
      id: 'aspire-logs-workers',
      title: 'Read workers background logs',
      cwd: this.projectRoot,
      command: ['aspire', 'logs', 'workers', '--apphost', this.appHost, '-n', '120'],
    });
    await this.#runCommand({
      id: 'aspire-logs-workers-api',
      title: 'Read workers API logs',
      cwd: this.projectRoot,
      command: ['aspire', 'logs', 'workers-api', '--apphost', this.appHost, '-n', '120'],
    });
    await this.#runCommand({
      id: 'aspire-logs-auth',
      title: 'Read auth logs',
      cwd: this.projectRoot,
      command: ['aspire', 'logs', 'auth', '--apphost', this.appHost, '-n', '120'],
    });
  }

  async #exerciseApis(): Promise<void> {
    await this.#httpGet(
      'http-workers-health',
      'Workers API health',
      `${this.#options.workersUrl}/health`,
    );
    await this.#httpGet(
      'http-sagas-live',
      'Sagas API liveness',
      `${this.#options.sagasUrl}/health/live`,
    );
    await this.#httpGet(
      'http-sagas-ready',
      'Sagas API readiness',
      `${this.#options.sagasUrl}/health/ready`,
    );
    await this.#httpGet(
      'http-triggers-health',
      'Triggers API health',
      `${this.#options.triggersUrl}/health`,
    );
    await this.#httpGet(
      'http-auth-live',
      'Auth API liveness',
      `${this.#options.authUrl}/health/live`,
    );
    await this.#httpGet(
      'http-auth-ready',
      'Auth API readiness',
      `${this.#options.authUrl}/health/ready`,
    );
    await this.#httpGet(
      'http-auth-session',
      'Resolve unauthenticated auth session',
      `${this.#options.authUrl}/api/v1/auth/session`,
    );

    await this.#httpGet(
      'http-workers-jobs',
      'List worker jobs',
      `${this.#options.workersUrl}/api/v1/workers/jobs`,
    );
    await this.#httpGet(
      'http-workers-tasks',
      'List worker tasks',
      `${this.#options.workersUrl}/api/v1/workers/tasks`,
    );
    await this.#httpPost(
      'http-workers-seed',
      'Seed worker demo data through API',
      `${this.#options.workersUrl}/api/v1/workers/seed`,
    );
    await this.#httpPost(
      'http-workers-trigger-health-job',
      'Trigger workers-plugin-health-check job',
      `${this.#options.workersUrl}/api/v1/workers/jobs/workers-plugin-health-check/trigger`,
    );
    await this.#sleep('wait-worker-execution', 'Wait for worker execution to complete', 8_000);
    await this.#httpGet(
      'http-workers-executions',
      'List recent worker executions',
      `${this.#options.workersUrl}/api/v1/workers/executions?limit=10`,
    );

    await this.#httpGet(
      'http-sagas-list',
      'List saga definitions',
      `${this.#options.sagasUrl}/api/v1/sagas/sagas`,
    );
    await this.#httpGet(
      'http-sagas-instances',
      'List saga instances',
      `${this.#options.sagasUrl}/api/v1/sagas/instances`,
    );
    await this.#httpGet(
      'http-triggers-list',
      'List trigger definitions',
      `${this.#options.triggersUrl}/api/v1/triggers/triggers`,
    );
    await this.#httpGet(
      'http-triggers-events',
      'List trigger events',
      `${this.#options.triggersUrl}/api/v1/triggers/events`,
    );
  }

  async #runPluginVerifier(): Promise<void> {
    await this.#runCommand({
      id: 'workers-plugin-verifier',
      title: 'Run plugin-owned workers verifier',
      cwd: this.projectRoot,
      command: [
        'deno',
        'run',
        '--allow-net',
        '--allow-env',
        'plugins/workers/verify-plugin.ts',
        '--seed',
      ],
    });
  }

  async #checkTelemetry(): Promise<void> {
    if (this.#options.skipTelemetry) {
      this.#record({
        id: 'telemetry-skipped',
        title: 'Telemetry checks skipped',
        kind: 'summary',
        status: 'skipped',
        critical: false,
        durationMs: 0,
      });
      return;
    }

    const critical = this.#options.strictTelemetry;
    await this.#tcpCheck({
      id: 'telemetry-otlp-port',
      title: 'OTLP HTTP collector accepts TCP connections',
      host: 'localhost',
      port: 4318,
      critical,
    });
    await this.#runCommand({
      id: 'telemetry-otel-logs',
      title: 'Query Aspire structured logs for workers',
      cwd: this.projectRoot,
      command: [
        'aspire',
        'otel',
        'logs',
        'workers',
        '--apphost',
        this.appHost,
        '--non-interactive',
        '--nologo',
        '--limit',
        '20',
        '--format',
        'Json',
      ],
      critical,
    });
    await this.#runCommand({
      id: 'telemetry-otel-traces',
      title: 'Query Aspire traces for workers',
      cwd: this.projectRoot,
      command: [
        'aspire',
        'otel',
        'traces',
        'workers',
        '--apphost',
        this.appHost,
        '--non-interactive',
        '--nologo',
        '--limit',
        '20',
        '--format',
        'Json',
      ],
      critical,
    });
  }

  async #cleanupAspire(): Promise<void> {
    await this.#runCommand({
      id: 'aspire-stop',
      title: 'Stop generated Aspire AppHost',
      cwd: this.projectRoot,
      command: this.stopCommand,
      critical: false,
    });
    this.#stoppedAspire = true;
  }

  async #runCommand(options: {
    id: string;
    title: string;
    cwd: string;
    command: string[];
    env?: Record<string, string>;
    critical?: boolean;
  }): Promise<void> {
    const critical = options.critical ?? true;
    const startedAt = performance.now();
    const commandDetails = {
      command: options.command.join(' '),
      cwd: options.cwd,
    };
    this.#emitStart({
      id: options.id,
      title: options.title,
      kind: 'command',
      critical,
      details: commandDetails,
    });

    if (this.#options.dryRun) {
      this.#record({
        ...createBaseStep(options.id, options.title, 'command', critical, startedAt),
        status: 'skipped',
        details: { command: options.command, cwd: options.cwd },
      });
      return;
    }

    const heartbeat = setInterval(() => {
      this.#emitProgress(options.id, options.title, Math.round(performance.now() - startedAt));
    }, this.#options.progressIntervalMs);

    try {
      const [command, ...args] = options.command;
      const result = await withTimeout(
        this.#options.commandTimeoutMs,
        (signal) =>
          new Deno.Command(command, {
            args,
            cwd: options.cwd,
            env: options.env,
            stdout: 'piped',
            stderr: 'piped',
            signal,
          }).output(),
      );

      if (result.timedOut || !result.value) {
        this.#record({
          ...createBaseStep(options.id, options.title, 'command', critical, startedAt),
          status: critical ? 'failed' : 'warning',
          details: { command: options.command, cwd: options.cwd, timedOut: true },
          error: `Command timed out after ${this.#options.commandTimeoutMs}ms`,
        });
        return;
      }

      const output = result.value;
      const passed = output.code === 0;
      this.#record({
        ...createBaseStep(options.id, options.title, 'command', critical, startedAt),
        status: passed ? 'passed' : critical ? 'failed' : 'warning',
        details: {
          command: options.command,
          cwd: options.cwd,
          exitCode: output.code,
          stdoutTail: tail(decoder.decode(output.stdout)),
          stderrTail: tail(decoder.decode(output.stderr)),
        },
        error: passed ? undefined : `Command exited with code ${output.code}`,
      });
    } catch (error: unknown) {
      this.#record({
        ...createBaseStep(options.id, options.title, 'command', critical, startedAt),
        status: critical ? 'failed' : 'warning',
        details: { command: options.command, cwd: options.cwd },
        error: unknownToMessage(error),
      });
    } finally {
      clearInterval(heartbeat);
    }
  }

  async #httpGet(id: string, title: string, url: string): Promise<void> {
    await this.#httpRequest(id, title, 'GET', url);
  }

  async #httpPost(id: string, title: string, url: string): Promise<void> {
    await this.#httpRequest(id, title, 'POST', url);
  }

  async #httpRequest(id: string, title: string, method: string, url: string): Promise<void> {
    const startedAt = performance.now();
    const critical = true;
    this.#emitStart({
      id,
      title,
      kind: 'http',
      critical,
      details: { method, url },
    });

    if (this.#options.dryRun) {
      this.#record({
        ...createBaseStep(id, title, 'http', critical, startedAt),
        status: 'skipped',
        details: { method, url },
      });
      return;
    }

    try {
      const result = await withTimeout(this.#options.httpTimeoutMs, async (signal) => {
        const response = await fetch(url, { method, signal });
        const body = await response.text();
        return { response, body };
      });

      if (result.timedOut || !result.value) {
        this.#record({
          ...createBaseStep(id, title, 'http', critical, startedAt),
          status: 'failed',
          details: { method, url, timedOut: true },
          error: `HTTP request timed out after ${this.#options.httpTimeoutMs}ms`,
        });
        return;
      }

      const { response, body } = result.value;
      let jsonSummary: unknown;
      try {
        jsonSummary = summarizeJson(JSON.parse(body));
      } catch {
        jsonSummary = undefined;
      }

      this.#record({
        ...createBaseStep(id, title, 'http', critical, startedAt),
        status: response.ok ? 'passed' : 'failed',
        details: {
          method,
          url,
          statusCode: response.status,
          ok: response.ok,
          bodyPreview: tail(body, 2_000),
          jsonSummary,
        },
        error: response.ok ? undefined : `HTTP ${response.status} from ${url}`,
      });
    } catch (error: unknown) {
      this.#record({
        ...createBaseStep(id, title, 'http', critical, startedAt),
        status: 'failed',
        details: { method, url },
        error: unknownToMessage(error),
      });
    }
  }

  async #tcpCheck(options: {
    id: string;
    title: string;
    host: string;
    port: number;
    critical: boolean;
  }): Promise<void> {
    const startedAt = performance.now();
    this.#emitStart({
      id: options.id,
      title: options.title,
      kind: 'tcp',
      critical: options.critical,
      details: { host: options.host, port: options.port },
    });

    if (this.#options.dryRun) {
      this.#record({
        ...createBaseStep(options.id, options.title, 'tcp', options.critical, startedAt),
        status: 'skipped',
        details: { host: options.host, port: options.port },
      });
      return;
    }

    try {
      const result = await Promise.race([
        Deno.connect({ hostname: options.host, port: options.port, transport: 'tcp' }),
        delay(this.#options.httpTimeoutMs).then(() => null),
      ]);

      if (result === null) {
        this.#record({
          ...createBaseStep(options.id, options.title, 'tcp', options.critical, startedAt),
          status: options.critical ? 'failed' : 'warning',
          details: { host: options.host, port: options.port, connected: false, timedOut: true },
          error: `TCP check timed out after ${this.#options.httpTimeoutMs}ms`,
        });
        return;
      }

      result.close();
      this.#record({
        ...createBaseStep(options.id, options.title, 'tcp', options.critical, startedAt),
        status: 'passed',
        details: { host: options.host, port: options.port, connected: true },
      });
    } catch (error: unknown) {
      this.#record({
        ...createBaseStep(options.id, options.title, 'tcp', options.critical, startedAt),
        status: options.critical ? 'failed' : 'warning',
        details: { host: options.host, port: options.port, connected: false },
        error: unknownToMessage(error),
      });
    }
  }

  async #sleep(id: string, title: string, durationMs: number): Promise<void> {
    const startedAt = performance.now();
    this.#emitStart({
      id,
      title,
      kind: 'sleep',
      critical: true,
      details: { durationMs },
    });
    if (!this.#options.dryRun) {
      await delay(durationMs);
    }
    this.#record({
      ...createBaseStep(id, title, 'sleep', true, startedAt),
      status: this.#options.dryRun ? 'skipped' : 'passed',
      details: { durationMs },
    });
  }

  #buildReport(durationMs: number): Report {
    const failed = this.#steps.filter((step) => step.status === 'failed').length;
    const warnings = this.#steps.filter((step) => step.status === 'warning').length;
    const skipped = this.#steps.filter((step) => step.status === 'skipped').length;
    const passed = this.#steps.filter((step) => step.status === 'passed').length;
    const criticalFailed = this.#steps.some((step) => step.critical && step.status === 'failed');

    return {
      ok: !criticalFailed,
      startedAspire: this.#startedAspire,
      stoppedAspire: this.#stoppedAspire,
      project: {
        repo: this.#options.repo,
        smokeRoot: this.#options.smokeRoot,
        name: this.#options.name,
        root: this.projectRoot,
        appHost: this.appHost,
        stopCommand: this.stopCommand,
        logFile: this.#options.logFile,
      },
      options: {
        db: this.#options.db,
        source: this.#options.source,
        samples: this.#options.samples,
        cleanup: this.#options.cleanup,
        dryRun: this.#options.dryRun,
        skipTelemetry: this.#options.skipTelemetry,
        strictTelemetry: this.#options.strictTelemetry,
        format: this.#options.format,
        progressIntervalMs: this.#options.progressIntervalMs,
      },
      summary: {
        total: this.#steps.length,
        passed,
        failed,
        warnings,
        skipped,
        durationMs,
      },
      steps: this.#steps,
    };
  }
}

async function main(): Promise<void> {
  const options = await parseCliOptions(Deno.args);
  if (!options) {
    return;
  }

  const runner = new SmokeRunner(options);
  const report = await runner.run();

  if (options.format === 'ndjson') {
    console.log(JSON.stringify({ event: 'summary', report }));
  } else if (options.format === 'pretty') {
    printPrettySummary(report);
  } else {
    console.log(JSON.stringify(report));
  }

  if (!report.ok) {
    Deno.exit(1);
  }
}

await main();
