import { isRecord } from '../../domain/schema.ts';
import type { ToolExecutionResult, ToolFailure, ToolFlow } from '../../domain/tool-types.ts';
import type {
  ExportSurfaceCorpus,
  ExportSurfaceCorpusPort,
  ExportSurfaceEntry,
} from '../../ports/export-surface-corpus-port.ts';

/** Maximum exact-symbol locations returned by `find_export`. */
export const FIND_EXPORT_RESULT_LIMIT = 20;
/** Maximum declarations returned by one `list_package_exports` page. */
export const LIST_PACKAGE_EXPORT_RESULT_LIMIT = 49;
/** Maximum ranked declarations returned by `search_exports`. */
export const SEARCH_EXPORT_RESULT_LIMIT = 20;
/** Maximum characters returned for one exact declaration signature. */
export const EXPORT_SIGNATURE_CHARACTER_LIMIT = 1_200;
/** Maximum characters returned for one exact declaration JSDoc block. */
export const EXPORT_JSDOC_CHARACTER_LIMIT = 1_600;

/** Stable names of the four generated export-surface tools. */
export type ExportSurfaceToolName =
  | 'find_export'
  | 'list_package_exports'
  | 'get_export'
  | 'search_exports';

interface RankedExport {
  readonly entry: ExportSurfaceEntry;
  readonly score: number;
}

/** Create the four bounded export-surface discovery flows in priority order. */
export function createExportSurfaceFlows(
  corpus: ExportSurfaceCorpusPort,
): Readonly<Record<ExportSurfaceToolName, ToolFlow>> {
  return {
    find_export: async (input): Promise<ToolExecutionResult> => {
      const symbol = requiredString(input, 'symbol');
      if (!symbol.ok) return symbol;
      const limit = boundedInteger(
        input,
        'limit',
        FIND_EXPORT_RESULT_LIMIT,
        FIND_EXPORT_RESULT_LIMIT,
      );
      return await withCorpus(corpus, (loaded) => {
        const matches = sortEntries(
          loaded.entries.filter((entry) => entry.symbol === symbol.value),
        );
        const selected = matches.slice(0, limit);
        return success({
          symbol: symbol.value,
          total: matches.length,
          matches: selected.map((entry) => ({
            package: entry.packageName,
            subpath: entry.subpath,
            kind: entry.kind,
          })),
          truncated: selected.length < matches.length,
        });
      });
    },

    list_package_exports: async (input): Promise<ToolExecutionResult> => {
      const packageName = requiredString(input, 'package');
      if (!packageName.ok) return packageName;
      const offset = boundedInteger(input, 'offset', 0, Number.MAX_SAFE_INTEGER, 0);
      const limit = boundedInteger(
        input,
        'limit',
        LIST_PACKAGE_EXPORT_RESULT_LIMIT,
        LIST_PACKAGE_EXPORT_RESULT_LIMIT,
      );
      return await withCorpus(corpus, (loaded) => {
        const entries = sortEntries(
          loaded.entries.filter((entry) => entry.packageName === packageName.value),
        );
        const selected = entries.slice(offset, offset + limit);
        const groups = groupBySubpath(entries, selected);
        const nextOffset = offset + selected.length;
        return success({
          package: packageName.value,
          total: entries.length,
          returned: selected.length,
          offset,
          groups,
          ...(nextOffset < entries.length ? { nextOffset } : {}),
          truncated: nextOffset < entries.length,
        });
      });
    },

    get_export: async (input): Promise<ToolExecutionResult> => {
      const symbol = requiredString(input, 'symbol');
      if (!symbol.ok) return symbol;
      const packageName = optionalString(input, 'package');
      if (!packageName.ok) return packageName;
      const subpath = optionalString(input, 'subpath');
      if (!subpath.ok) return subpath;
      return await withCorpus(corpus, (loaded) => {
        const matches = sortEntries(
          loaded.entries.filter((entry) =>
            entry.symbol === symbol.value &&
            (packageName.value === undefined || entry.packageName === packageName.value) &&
            (subpath.value === undefined || entry.subpath === subpath.value)
          ),
        );
        if (matches.length === 0) {
          return failure(
            'export_not_found',
            `No export named ${symbol.value} matches the requested package and subpath.`,
          );
        }
        if (matches.length > 1) {
          const candidates = matches.slice(0, 5).map((entry) =>
            `${entry.packageName}${displaySubpath(entry.subpath)}`
          );
          const suffix = matches.length > candidates.length ? ', …' : '';
          return failure(
            'export_ambiguous',
            `${symbol.value} has ${matches.length} matching exports: ${
              candidates.join(', ')
            }${suffix}. ` +
              'Specify package and subpath.',
          );
        }
        const entry = matches[0]!;
        const signature = truncateText(entry.signature, EXPORT_SIGNATURE_CHARACTER_LIMIT);
        const jsDoc = truncateText(entry.jsDoc, EXPORT_JSDOC_CHARACTER_LIMIT);
        return success({
          package: entry.packageName,
          subpath: entry.subpath,
          symbol: entry.symbol,
          kind: entry.kind,
          signature: signature.value,
          jsDoc: jsDoc.value,
          truncated: signature.truncated || jsDoc.truncated,
        });
      });
    },

    search_exports: async (input): Promise<ToolExecutionResult> => {
      const query = requiredString(input, 'query');
      if (!query.ok) return query;
      const packageName = optionalString(input, 'package');
      if (!packageName.ok) return packageName;
      const kind = optionalString(input, 'kind');
      if (!kind.ok) return kind;
      const limit = boundedInteger(
        input,
        'limit',
        SEARCH_EXPORT_RESULT_LIMIT,
        SEARCH_EXPORT_RESULT_LIMIT,
      );
      return await withCorpus(corpus, (loaded) => {
        const ranked = loaded.entries
          .filter((entry) =>
            (packageName.value === undefined || entry.packageName === packageName.value) &&
            (kind.value === undefined || entry.kind.toLowerCase() === kind.value.toLowerCase())
          )
          .map((entry) => ({ entry, score: scoreEntry(entry, query.value) }))
          .filter((candidate) => candidate.score > 0)
          .sort(compareRanked);
        const selected = ranked.slice(0, limit);
        let stringTruncated = false;
        const matches = selected.map(({ entry, score }) => {
          const signature = truncateText(entry.signature, 400);
          stringTruncated ||= signature.truncated;
          return {
            package: entry.packageName,
            subpath: entry.subpath,
            symbol: entry.symbol,
            kind: entry.kind,
            signature: signature.value,
            score,
          };
        });
        return success({
          query: query.value,
          total: ranked.length,
          matches,
          truncated: selected.length < ranked.length || stringTruncated,
        });
      });
    },
  };
}

function groupBySubpath(
  allEntries: readonly ExportSurfaceEntry[],
  selected: readonly ExportSurfaceEntry[],
): readonly Record<string, unknown>[] {
  const totals = new Map<string, number>();
  for (const entry of allEntries) totals.set(entry.subpath, (totals.get(entry.subpath) ?? 0) + 1);
  const groups = new Map<string, Array<{ name: string; kind: string }>>();
  for (const entry of selected) {
    const symbols = groups.get(entry.subpath) ?? [];
    symbols.push({ name: entry.symbol, kind: entry.kind });
    groups.set(entry.subpath, symbols);
  }
  return [...groups].map(([subpath, symbols]) => ({
    subpath,
    total: totals.get(subpath) ?? symbols.length,
    symbols,
  }));
}

function scoreEntry(entry: ExportSurfaceEntry, rawQuery: string): number {
  const query = rawQuery.trim().toLowerCase();
  const symbol = entry.symbol.toLowerCase();
  if (symbol === query) return 100;
  if (symbol.startsWith(query)) return 90;
  if (splitIdentifier(entry.symbol).some((part) => part.startsWith(query))) return 80;
  if (symbol.includes(query)) return 70;

  const tokens = query.split(/[^a-z0-9]+/).filter(Boolean);
  const identifier = splitIdentifier(entry.symbol).join(' ');
  const signature = entry.signature.toLowerCase();
  const jsDoc = entry.jsDoc.toLowerCase();
  const location = `${entry.packageName} ${entry.subpath}`.toLowerCase();
  if (tokens.length > 0 && tokens.every((token) => identifier.includes(token))) return 60;
  if (tokens.length > 0 && tokens.every((token) => signature.includes(token))) return 45;
  if (tokens.length > 0 && tokens.every((token) => jsDoc.includes(token))) return 35;
  if (tokens.length > 0 && tokens.every((token) => location.includes(token))) return 20;
  return 0;
}

function splitIdentifier(value: string): string[] {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .map((part) => part.toLowerCase())
    .filter(Boolean);
}

function compareRanked(left: RankedExport, right: RankedExport): number {
  return right.score - left.score || compareEntries(left.entry, right.entry);
}

function sortEntries(entries: readonly ExportSurfaceEntry[]): ExportSurfaceEntry[] {
  return [...entries].sort(compareEntries);
}

function compareEntries(left: ExportSurfaceEntry, right: ExportSurfaceEntry): number {
  return left.packageName.localeCompare(right.packageName) ||
    left.subpath.localeCompare(right.subpath) ||
    left.symbol.localeCompare(right.symbol) ||
    left.kind.localeCompare(right.kind);
}

function displaySubpath(subpath: string): string {
  return subpath === '.' ? '' : subpath.slice(1);
}

function truncateText(value: string, maximum: number): { value: string; truncated: boolean } {
  if (value.length <= maximum) return { value, truncated: false };
  return { value: `${value.slice(0, Math.max(0, maximum - 1))}…`, truncated: true };
}

async function withCorpus(
  port: ExportSurfaceCorpusPort,
  action: (corpus: ExportSurfaceCorpus) => Promise<ToolExecutionResult> | ToolExecutionResult,
): Promise<ToolExecutionResult> {
  try {
    return await action(await port.load());
  } catch (error) {
    const cause = error instanceof Error && error.message.trim()
      ? truncateText(error.message.trim(), 600).value
      : 'unknown corpus load failure';
    return failure(
      'export_corpus_error',
      `The generated export-surface corpus could not complete the request: ${cause}`,
    );
  }
}

function requiredString(
  input: unknown,
  key: string,
): { ok: true; value: string } | ToolFailure {
  if (!isRecord(input) || typeof input[key] !== 'string' || !input[key].trim()) {
    return failure('invalid_input', `${key} must be a non-empty string`);
  }
  return { ok: true, value: input[key].trim() };
}

function optionalString(
  input: unknown,
  key: string,
): { ok: true; value: string | undefined } | ToolFailure {
  if (!isRecord(input) || input[key] === undefined) return { ok: true, value: undefined };
  if (typeof input[key] !== 'string' || !input[key].trim()) {
    return failure('invalid_input', `${key} must be a non-empty string when provided`);
  }
  return { ok: true, value: input[key].trim() };
}

function boundedInteger(
  input: unknown,
  key: string,
  fallback: number,
  maximum: number,
  minimum = 1,
): number {
  if (!isRecord(input) || !Number.isInteger(input[key])) return fallback;
  return Math.min(maximum, Math.max(minimum, input[key] as number));
}

function success(value: Record<string, unknown>): ToolExecutionResult {
  return { ok: true, value };
}

function failure(code: string, message: string): ToolFailure {
  return { ok: false, error: { code, message } };
}
