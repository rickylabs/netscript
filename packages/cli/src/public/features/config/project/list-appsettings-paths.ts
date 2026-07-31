/**
 * @module public/features/config/project/list-appsettings-paths
 *
 * Enumerates the canonical, case-sensitive `appsettings.json` paths — the ones
 * `netscript config set` accepts and the Aspire generator reads.
 *
 * The listing also surfaces keys the project's `appsettings.json` contains but
 * the generator's schema does not model, so a dead key written by an earlier
 * tool is visible rather than mistaken for live configuration.
 */

import {
  appsettingsSchemaRoot,
  isObject,
  type SchemaNode,
  schemaChildren,
  step,
} from './read-appsettings-schema.ts';
import type { AppsettingsPathStatus } from './resolve-appsettings-path.ts';

/** Rendered where a record has no entries yet, e.g. `NetScript.Databases.<key>.Engine`. */
export const RECORD_KEY_PLACEHOLDER = '<key>';

const MAX_DEPTH = 8;

/** One canonical configuration path, with the project's current value when set. */
export interface AppsettingsPathEntry {
  /** Canonical, case-sensitive dotted path. */
  readonly path: string;
  /** Whether the generator's schema models this path. */
  readonly status: AppsettingsPathStatus;
  /** Current value in the project's `appsettings.json`, when present. */
  readonly value?: unknown;
}

/**
 * List the canonical configuration paths for a project.
 *
 * @param document - Parsed `appsettings.json`, when the project has one.
 * @param prefix - Case-insensitive filter applied to the canonical path.
 */
export function listAppsettingsPaths(
  document?: unknown,
  prefix?: string,
): readonly AppsettingsPathEntry[] {
  const entries = [
    ...schemaPaths(appsettingsSchemaRoot(), [], document, 0),
    ...offSchemaPaths(document, appsettingsSchemaRoot(), [], 0),
  ];
  const filter = prefix?.toLowerCase();
  const matching = filter
    ? entries.filter((entry) => entry.path.toLowerCase().includes(filter))
    : entries;
  return matching.sort((left, right) => left.path.localeCompare(right.path));
}

/** Walk the schema tree, emitting one entry per settable leaf. */
function schemaPaths(
  node: SchemaNode,
  trail: readonly string[],
  value: unknown,
  depth: number,
): AppsettingsPathEntry[] {
  if (depth > MAX_DEPTH) return [];
  const children = schemaChildren(node);
  const fields = Object.entries(children.fields);
  if (fields.length === 0 && !children.record) {
    return trail.length > 0 ? [leaf(trail, value)] : [];
  }

  const entries: AppsettingsPathEntry[] = [];
  for (const [name, child] of fields) {
    entries.push(...schemaPaths(child, [...trail, name], step(value, name), depth + 1));
  }
  if (children.record) {
    const keys = isObject(value) ? Object.keys(value) : [];
    for (const key of keys.length > 0 ? keys : [RECORD_KEY_PLACEHOLDER]) {
      entries.push(
        ...schemaPaths(children.record, [...trail, key], step(value, key), depth + 1),
      );
    }
  }
  return entries;
}

/** Walk the document, emitting leaves the schema does not model. */
function offSchemaPaths(
  value: unknown,
  node: SchemaNode | undefined,
  trail: readonly string[],
  depth: number,
): AppsettingsPathEntry[] {
  if (depth > MAX_DEPTH || !isObject(value)) return [];
  const children = node ? schemaChildren(node) : undefined;
  const entries: AppsettingsPathEntry[] = [];
  for (const [key, child] of Object.entries(value)) {
    const known = children?.fields[key] ?? children?.record;
    if (!known) {
      entries.push(...unknownLeaves(child, [...trail, key], depth + 1));
      continue;
    }
    entries.push(...offSchemaPaths(child, known, [...trail, key], depth + 1));
  }
  return entries;
}

/** Every leaf beneath a key the schema does not model. */
function unknownLeaves(
  value: unknown,
  trail: readonly string[],
  depth: number,
): AppsettingsPathEntry[] {
  if (depth > MAX_DEPTH) return [];
  if (!isObject(value) || Object.keys(value).length === 0) {
    return [{ path: trail.join('.'), status: 'unknown', value }];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    unknownLeaves(child, [...trail, key], depth + 1)
  );
}

function leaf(trail: readonly string[], value: unknown): AppsettingsPathEntry {
  const path = trail.join('.');
  return value === undefined
    ? { path, status: 'known' }
    : { path, status: 'known', value };
}
