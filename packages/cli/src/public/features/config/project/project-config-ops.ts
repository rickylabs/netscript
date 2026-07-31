import { inspectConfig, type NetScriptConfig } from '@netscript/config';
import { join } from '@std/path';

import { ConfigInvalidError, ConfigNotFoundError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { isObject, step } from './read-appsettings-schema.ts';
import {
  collectSchemaIssues,
  type ResolvedAppsettingsPath,
  resolveAppsettingsPath,
} from './resolve-appsettings-path.ts';

const APPSETTINGS_FILE = 'appsettings.json';

/** Options controlling how a project configuration value is written. */
export interface SetProjectConfigOptions {
  /** Write a path the generator does not read, reporting a warning instead of failing. */
  readonly force?: boolean;
}

/** What `setProjectConfigValue` actually wrote. */
export interface SetProjectConfigResult {
  /** The path as the user typed it. */
  readonly requestedPath: string;
  /** The canonical, case-correct key the value was written to. */
  readonly canonicalPath: string;
  /** Whether the write bypassed schema validation via `force`. */
  readonly forced: boolean;
}

/** Read a dotted value from a JSON-like object. */
export function getDottedValue(target: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (value, part) => isObject(value) ? value[part] : undefined,
    target,
  );
}

/** Inspect a loaded project config through the package diagnostic seam. */
export function inspectProjectConfig(config: NetScriptConfig): ReturnType<typeof inspectConfig> {
  return inspectConfig(config);
}

/**
 * Persist a value into generated `appsettings.json` at the canonical key the
 * Aspire generator reads.
 *
 * Refuses paths the generator's schema does not model: a config command that
 * exits 0 without changing behaviour costs more time than one that fails.
 */
export async function setProjectConfigValue(
  fs: FileSystemPort,
  projectRoot: string,
  dottedPath: string,
  value: unknown,
  options?: SetProjectConfigOptions,
): Promise<SetProjectConfigResult> {
  const path = join(projectRoot, APPSETTINGS_FILE);
  const document = await readAppsettingsDocument(fs, path);
  if (!document) throw new ConfigNotFoundError([path]);

  const resolved = resolveAppsettingsPath(dottedPath, document);
  const forced = options?.force === true;
  if (resolved.status === 'unknown' && !forced) {
    throw new ConfigInvalidError(unknownPathMessage(resolved), path);
  }

  const next = assignDottedValue(document, resolved.segments, value);
  if (resolved.status === 'known') {
    const issues = collectSchemaIssues(next, resolved.segments);
    if (issues.length > 0) {
      throw new ConfigInvalidError(
        `Rejected by the NetScript appsettings schema: ${issues.join('; ')}.`,
        path,
      );
    }
  }

  await fs.writeFile(path, `${JSON.stringify(next, null, 2)}\n`);
  return { requestedPath: dottedPath, canonicalPath: resolved.canonical, forced };
}

/** Read a value from generated `appsettings.json` through canonical path resolution. */
export async function readAppsettingsValue(
  fs: FileSystemPort,
  projectRoot: string,
  dottedPath: string,
): Promise<unknown> {
  const document = await readAppsettingsDocument(fs, join(projectRoot, APPSETTINGS_FILE));
  if (!document) return undefined;
  // Walk the resolved segments rather than the dotted string: a record key may
  // itself contain a dot.
  return resolveAppsettingsPath(dottedPath, document).segments
    .reduce<unknown>((value, segment) => step(value, segment), document);
}

/** Load the project's `appsettings.json`, or `undefined` when it does not exist. */
export async function readAppsettingsDocument(
  fs: FileSystemPort,
  path: string,
): Promise<Record<string, unknown> | undefined> {
  if (!await fs.exists(path)) return undefined;
  const parsed = JSON.parse(await fs.readFile(path)) as unknown;
  return isObject(parsed) ? { ...parsed } : {};
}

/** Explain an unresolvable path and how to recover from it. */
function unknownPathMessage(resolved: ResolvedAppsettingsPath): string {
  const suggestions = resolved.suggestions.length > 0
    ? ` Did you mean: ${resolved.suggestions.join(', ')}?`
    : '';
  return `Unknown configuration path "${resolved.input}" — ${resolved.reason}. ` +
    `The Aspire generator would never read it, so nothing was written.${suggestions} ` +
    `Run 'netscript config list' for the canonical paths, or pass --force to write it anyway.`;
}

/** Copy `document` with `value` set at `segments`, creating intermediate objects. */
function assignDottedValue(
  document: Readonly<Record<string, unknown>>,
  segments: readonly string[],
  value: unknown,
): Record<string, unknown> {
  const next = structuredClone(document) as Record<string, unknown>;
  let current = next;
  for (const segment of segments.slice(0, -1)) {
    const child = current[segment];
    current = isObject(child)
      ? (current[segment] = { ...child }) as Record<string, unknown>
      : (current[segment] = {}) as Record<string, unknown>;
  }
  current[segments.at(-1)!] = value;
  return next;
}
