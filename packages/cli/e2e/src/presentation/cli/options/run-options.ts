import {
  DATABASE,
  PACKAGE_SOURCE,
  PLUGIN,
  type PluginKind,
  REPORT_FORMAT,
  type ReportFormat,
} from '../../../domain/extension-axes.ts';
import type { RunOptions } from '../../../domain/run-context.ts';

/** Raw Cliffy run options. */
export interface RawRunOptions {
  readonly repo?: string;
  readonly cli?: string;
  readonly smokeRoot?: string;
  readonly name?: string;
  readonly db?: string;
  readonly source?: string;
  readonly plugins?: string;
  readonly samples?: boolean;
  readonly cleanup?: boolean;
  readonly format?: string;
  readonly report?: string;
  readonly logFile?: string;
}

/** Convert CLI flags to runner option overrides. */
export function mapRunOptions(raw: RawRunOptions): Partial<RunOptions> {
  return compactOptions({
    repoRoot: raw.repo,
    cliEntrypoint: raw.cli,
    smokeRoot: raw.smokeRoot,
    projectName: raw.name,
    database: parseDatabase(raw.db),
    packageSource: parseSource(raw.source),
    plugins: parsePlugins(raw.plugins),
    samples: raw.samples,
    cleanup: raw.cleanup,
    format: parseFormat(raw.format),
    reportPath: raw.report,
    logFile: raw.logFile,
  });
}

function parseSource(raw: string | undefined): RunOptions['packageSource'] | undefined {
  if (raw === undefined) return undefined;
  if (isOneOf(PACKAGE_SOURCE, raw)) return raw;
  throw new Error('--source must be auto, starter, or local.');
}

function parseFormat(raw: string | undefined): ReportFormat | undefined {
  if (raw === undefined) return undefined;
  if (isOneOf(REPORT_FORMAT, raw)) return raw;
  throw new Error('--format must be pretty, json, or ndjson.');
}

function parsePlugins(raw: string | undefined): readonly PluginKind[] | undefined {
  if (!raw) return undefined;
  return raw.split(',').map((value) => {
    const plugin = value.trim();
    if (isOneOf(PLUGIN, plugin)) return plugin;
    throw new Error(`Unsupported plugin kind: ${plugin}`);
  });
}

function parseDatabase(raw: string | undefined): RunOptions['database'] | undefined {
  if (raw === undefined) return undefined;
  if (isOneOf(DATABASE, raw)) return raw;
  throw new Error('--db must be postgres or mysql.');
}

function isOneOf<const T extends Record<string, string>>(
  values: T,
  value: string,
): value is T[keyof T] {
  return Object.values(values).includes(value);
}

function compactOptions(options: Partial<RunOptions>): Partial<RunOptions> {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as Partial<RunOptions>;
}
