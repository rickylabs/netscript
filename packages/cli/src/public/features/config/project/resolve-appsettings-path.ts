/**
 * @module public/features/config/project/resolve-appsettings-path
 *
 * Resolves a user-supplied dotted config path onto the canonical, case-correct
 * key inside `appsettings.json`.
 *
 * The path space is **derived**, never hand-maintained — see
 * `read-appsettings-schema.ts`. "The generator knows this key" is therefore
 * true by construction: a field added to `@netscript/aspire`'s schema is
 * settable here on the next run, and a key the schema does not model resolves
 * as `unknown` instead of being written silently.
 *
 * Record keys are user data. `postgres` in `NetScript.Databases.postgres` is a
 * name the developer chose; it is matched against the keys already in the
 * document and otherwise kept verbatim, never re-cased against the schema.
 */

import { AppSettingsSchema } from '@netscript/aspire/config';
import { levenshteinDistance } from '@std/text';

import {
  appsettingsSchemaRoot,
  isObject,
  type SchemaChildren,
  schemaChildren,
  type SchemaNode,
  step,
} from './read-appsettings-schema.ts';

/** Root section a bare, section-relative path is resolved under. */
export const ROOT_SECTION = 'NetScript';

/**
 * Dashboard-friendly shorthands that do not follow the schema's own spelling.
 * An explicit table, so a stale alias fails resolution instead of silently
 * writing a dead key — aliases are walked through the schema like any other
 * path.
 */
export const APPSETTINGS_PATH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  'telemetry.otlpEndpoint': ['NetScript', 'Otel', 'HttpEndpoint'],
};

const MAX_SUGGESTIONS = 8;

/** Whether the schema the Aspire generator parses models a resolved path. */
export type AppsettingsPathStatus = 'known' | 'unknown';

/** Outcome of resolving a user-supplied dotted config path. */
export interface ResolvedAppsettingsPath {
  /** The path exactly as the user typed it. */
  readonly input: string;
  /** Path segments to write: canonical where resolved, verbatim beyond that. */
  readonly segments: readonly string[];
  /** `segments`, dotted. */
  readonly canonical: string;
  /** Whether the generator's schema models this path. */
  readonly status: AppsettingsPathStatus;
  /** Why resolution failed, when `status` is `unknown`. */
  readonly reason?: string;
  /** Canonical sibling paths, closest first, to offer as corrections. */
  readonly suggestions: readonly string[];
}

/**
 * Resolve a user-supplied dotted path onto the canonical appsettings key.
 *
 * Accepts the full path (`NetScript.Databases.postgres.Persistent`), the
 * section-relative shorthand (`Databases.postgres.Persistent`), and any casing
 * of either. The shorthand is only accepted when the section it names actually
 * resolves, so a full path is never silently re-prefixed. `document` supplies
 * the live record keys so user-chosen keys keep their real casing.
 */
export function resolveAppsettingsPath(
  input: string,
  document?: unknown,
): ResolvedAppsettingsPath {
  const alias = APPSETTINGS_PATH_ALIASES[input];
  const requested = alias ? [...alias] : input.split('.').filter((part) => part.length > 0);
  if (requested.length === 0) {
    return { input, segments: [], canonical: input, status: 'unknown', reason: 'the path is empty', suggestions: [] };
  }

  const root = appsettingsSchemaRoot();
  const direct = walk(root, requested, document);
  if (direct.status === 'known') return describe(input, direct);
  if (matchFields(schemaChildren(root).fields, requested[0]!).length > 0) {
    return describe(input, direct);
  }

  // Section-relative shorthand: only accepted when the segment after the
  // injected root actually resolves, otherwise `Parameters.x` would be
  // reported (and force-written) as `NetScript.Parameters.x`.
  const prefixed = walk(root, [ROOT_SECTION, ...requested], document);
  return describe(input, prefixed.status === 'known' || prefixed.resolved > 1 ? prefixed : direct);
}

/**
 * Schema issues the generator's own parser would raise at or under `segments`.
 *
 * Scoped to the written path so an `appsettings.json` that is already invalid
 * somewhere else does not block an unrelated, correct write.
 */
export function collectSchemaIssues(
  document: unknown,
  segments: readonly string[],
): readonly string[] {
  const result = AppSettingsSchema.safeParse(document);
  if (result.success) return [];
  return schemaIssues(result.error)
    .filter((issue) => segments.every((segment, index) => issue.path[index] === segment))
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`);
}

/** One traversal of the schema tree against a requested segment list. */
interface Walk {
  readonly status: AppsettingsPathStatus;
  /** Canonical segments for the part that resolved. */
  readonly canonical: readonly string[];
  /** Segments to write: canonical prefix plus the unresolved remainder. */
  readonly segments: readonly string[];
  /** How many segments resolved before the walk stopped. */
  readonly resolved: number;
  readonly reason?: string;
  readonly suggestions: readonly string[];
}

function walk(root: SchemaNode, requested: readonly string[], document: unknown): Walk {
  const canonical: string[] = [];
  let node: SchemaNode = root;
  let value: unknown = document;

  for (const [index, segment] of requested.entries()) {
    const children = schemaChildren(node);
    const matches = matchFields(children.fields, segment);
    if (matches.length > 1) {
      return stopped(canonical, requested, index, `"${segment}" matches ${matches.join(', ')}`, matches);
    }
    const field = matches[0];
    if (field !== undefined) {
      canonical.push(field);
      node = children.fields[field]!;
      value = step(value, field);
      continue;
    }
    if (children.record) {
      const key = matchDocumentKey(value, segment) ?? segment;
      canonical.push(key);
      node = children.record;
      value = step(value, key);
      continue;
    }
    return stopped(canonical, requested, index, describeMiss(canonical, segment), suggestionsFor(children, segment));
  }

  return {
    status: 'known',
    canonical,
    segments: canonical,
    resolved: canonical.length,
    suggestions: [],
  };
}

function stopped(
  canonical: readonly string[],
  requested: readonly string[],
  index: number,
  reason: string,
  siblings: readonly string[],
): Walk {
  const prefix = canonical.length > 0 ? `${canonical.join('.')}.` : '';
  return {
    status: 'unknown',
    canonical,
    segments: [...canonical, ...requested.slice(index)],
    resolved: canonical.length,
    reason,
    suggestions: siblings.map((sibling) => `${prefix}${sibling}`),
  };
}

function describe(input: string, result: Walk): ResolvedAppsettingsPath {
  return {
    input,
    segments: result.segments,
    canonical: result.segments.join('.'),
    status: result.status,
    reason: result.reason,
    suggestions: result.suggestions,
  };
}

function describeMiss(canonical: readonly string[], segment: string): string {
  return canonical.length > 0
    ? `"${segment}" is not a key of ${canonical.join('.')}`
    : `"${segment}" is not a top-level key`;
}

function matchFields(
  fields: Readonly<Record<string, SchemaNode>>,
  segment: string,
): readonly string[] {
  const names = Object.keys(fields);
  const exact = names.filter((name) => name === segment);
  return exact.length > 0
    ? exact
    : names.filter((name) => name.toLowerCase() === segment.toLowerCase());
}

function matchDocumentKey(value: unknown, segment: string): string | undefined {
  if (!isObject(value)) return undefined;
  const keys = Object.keys(value);
  return keys.find((key) => key === segment) ??
    keys.find((key) => key.toLowerCase() === segment.toLowerCase());
}

function suggestionsFor(children: SchemaChildren, segment: string): readonly string[] {
  const target = segment.toLowerCase();
  return Object.keys(children.fields)
    .map((name) => ({ name, distance: levenshteinDistance(name.toLowerCase(), target) }))
    .sort((left, right) => left.distance - right.distance || left.name.localeCompare(right.name))
    .slice(0, MAX_SUGGESTIONS)
    .map((entry) => entry.name);
}

interface SchemaIssue {
  readonly path: readonly unknown[];
  readonly message: string;
}

function schemaIssues(error: unknown): readonly SchemaIssue[] {
  if (!isObject(error) || !Array.isArray(error.issues)) return [];
  return error.issues.filter((issue): issue is SchemaIssue =>
    isObject(issue) && Array.isArray(issue.path) && typeof issue.message === 'string'
  );
}
