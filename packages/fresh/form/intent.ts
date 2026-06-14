/**
 * Intent helpers for framework-owned form submissions.
 *
 * Intents are encoded into the native HTML form payload via a single hidden or
 * submit-button field. Plain submit actions use a short string, while
 * collection operations use JSON to preserve structured payloads.
 *
 * @module
 */

import type { CollectionKeyMap, FormIntent, FormValues } from './types.ts';

/** Field name reserved for encoded form intents. */
export const INTENT_FIELD_NAME = '__intent__';

const COLLECTION_INTENT_PREFIX = 'collection:';

type CollectionIntentAction = 'add' | 'duplicate' | 'remove' | 'reorder';

interface ParsedCollectionIntent {
  readonly action: CollectionIntentAction;
  readonly name: string;
  readonly defaultValue?: unknown;
  readonly index?: number;
  readonly from?: number;
  readonly to?: number;
}

/** Serialize a submit intent into the native field value shape. */
export function submitIntent(type = 'submit'): string {
  return type;
}

/** Serialize a collection intent into the native field value shape. */
export function collectionIntent(
  action: 'add' | 'duplicate' | 'remove' | 'reorder',
  name: string,
  payload: Record<string, unknown> = {},
): string {
  return JSON.stringify(
    {
      type: `${COLLECTION_INTENT_PREFIX}${action}`,
      payload: {
        name,
        ...payload,
      },
    } satisfies FormIntent,
  );
}

/** Parse an encoded form intent from raw posted values. */
export function parseFormIntent(rawValues: Record<string, unknown>): FormIntent | null {
  const rawIntent = rawValues[INTENT_FIELD_NAME];

  if (typeof rawIntent !== 'string') {
    return null;
  }

  const trimmed = rawIntent.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (isFormIntent(parsed)) {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return { type: trimmed };
}

/**
 * Apply a collection intent to the submitted values.
 *
 * Phase A only mutates existing array fields. Missing or malformed collection
 * targets are treated as a no-op so the higher-level pipeline can continue
 * without turning malformed intent payloads into runtime crashes.
 */
export function applyIntentOperation<TValues extends FormValues>(
  intent: FormIntent | null,
  values: TValues,
): TValues {
  const nextValues = structuredClone(values);
  const parsed = parseCollectionIntent(intent);

  if (!parsed) {
    return nextValues;
  }

  const collection = getCollectionArray(nextValues as Record<string, unknown>, parsed.name);
  if (!collection) {
    return nextValues;
  }

  switch (parsed.action) {
    case 'add':
      collection.push(structuredClone(parsed.defaultValue ?? {}));
      break;
    case 'remove':
      if (parsed.index !== undefined && parsed.index >= 0 && parsed.index < collection.length) {
        collection.splice(parsed.index, 1);
      }
      break;
    case 'duplicate':
      if (parsed.index !== undefined && parsed.index >= 0 && parsed.index < collection.length) {
        collection.splice(parsed.index + 1, 0, structuredClone(collection[parsed.index]));
      }
      break;
    case 'reorder':
      if (
        parsed.from !== undefined &&
        parsed.to !== undefined &&
        parsed.from >= 0 &&
        parsed.from < collection.length &&
        parsed.to >= 0 &&
        parsed.to < collection.length
      ) {
        const [moved] = collection.splice(parsed.from, 1);
        collection.splice(parsed.to, 0, moved);
      }
      break;
  }

  return nextValues;
}

export function applyCollectionKeyOperation(
  intent: FormIntent | null,
  collectionKeys: CollectionKeyMap,
): CollectionKeyMap {
  const parsed = parseCollectionIntent(intent);
  if (!parsed) {
    return structuredClone(collectionKeys);
  }

  const nextKeys = readCollectionItemKeys(collectionKeys, parsed.name);
  switch (parsed.action) {
    case 'add':
      nextKeys.push(crypto.randomUUID());
      break;
    case 'remove':
      if (parsed.index !== undefined && parsed.index >= 0 && parsed.index < nextKeys.length) {
        nextKeys.splice(parsed.index, 1);
      }
      break;
    case 'duplicate':
      if (parsed.index !== undefined && parsed.index >= 0 && parsed.index < nextKeys.length) {
        nextKeys.splice(parsed.index + 1, 0, crypto.randomUUID());
      }
      break;
    case 'reorder':
      if (
        parsed.from !== undefined &&
        parsed.to !== undefined &&
        parsed.from >= 0 &&
        parsed.from < nextKeys.length &&
        parsed.to >= 0 &&
        parsed.to < nextKeys.length
      ) {
        const [moved] = nextKeys.splice(parsed.from, 1);
        nextKeys.splice(parsed.to, 0, moved);
      }
      break;
  }

  return writeCollectionItemKeys(collectionKeys, parsed.name, nextKeys);
}

function isFormIntent(value: unknown): value is FormIntent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as { type?: unknown; payload?: unknown };
  return typeof candidate.type === 'string' &&
    (candidate.payload === undefined ||
      (typeof candidate.payload === 'object' && candidate.payload !== null));
}

function parseCollectionIntent(intent: FormIntent | null): ParsedCollectionIntent | null {
  if (!intent?.type.startsWith(COLLECTION_INTENT_PREFIX)) {
    return null;
  }

  const action = intent.type.slice(COLLECTION_INTENT_PREFIX.length);
  if (!isCollectionIntentAction(action)) {
    return null;
  }

  if (typeof intent.payload !== 'object' || intent.payload === null) {
    return null;
  }

  const payload = intent.payload as Record<string, unknown>;
  if (typeof payload.name !== 'string' || payload.name.length === 0) {
    return null;
  }

  return {
    action,
    name: payload.name,
    defaultValue: payload.defaultValue,
    index: toInteger(payload.index),
    from: toInteger(payload.from),
    to: toInteger(payload.to),
  };
}

function isCollectionIntentAction(value: string): value is CollectionIntentAction {
  return value === 'add' || value === 'duplicate' || value === 'remove' || value === 'reorder';
}

function toInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined;
}

function getCollectionArray(
  root: Record<string, unknown>,
  collectionName: string,
): unknown[] | undefined {
  let current: unknown = root;

  for (const segment of parseCollectionPath(collectionName)) {
    if (typeof segment === 'number') {
      if (!Array.isArray(current)) {
        return undefined;
      }

      current = current[segment];
      continue;
    }

    if (typeof current !== 'object' || current === null || Array.isArray(current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return Array.isArray(current) ? current : undefined;
}

function parseCollectionPath(path: string): Array<number | string> {
  const segments: Array<number | string> = [];

  for (const match of path.matchAll(/([^[.\]]+)|\[(\d+)\]/g)) {
    if (match[1]) {
      segments.push(match[1]);
      continue;
    }

    if (match[2]) {
      segments.push(Number.parseInt(match[2], 10));
    }
  }

  return segments.length > 0 ? segments : [path];
}

function readCollectionItemKeys(
  collectionKeys: CollectionKeyMap,
  collectionName: string,
): string[] {
  const collectionSegments = parseCollectionPath(collectionName);

  return Object.entries(collectionKeys)
    .flatMap(([path, key]) => {
      const pathSegments = parseCollectionPath(path);
      if (!hasSegmentPrefix(pathSegments, collectionSegments)) {
        return [];
      }

      const itemSegment = pathSegments[collectionSegments.length];
      if (
        pathSegments.length !== collectionSegments.length + 1 || typeof itemSegment !== 'number'
      ) {
        return [];
      }

      return [{ index: itemSegment, key }];
    })
    .sort((left, right) => left.index - right.index)
    .map((entry) => entry.key);
}

function writeCollectionItemKeys(
  collectionKeys: CollectionKeyMap,
  collectionName: string,
  itemKeys: readonly string[],
): CollectionKeyMap {
  const nextCollectionKeys = Object.fromEntries(
    Object.entries(collectionKeys).filter(([path]) => !isCollectionItemPath(path, collectionName)),
  );

  itemKeys.forEach((key, index) => {
    nextCollectionKeys[`${collectionName}[${index}]`] = key;
  });

  return nextCollectionKeys;
}

function isCollectionItemPath(path: string, collectionName: string): boolean {
  const collectionSegments = parseCollectionPath(collectionName);
  const pathSegments = parseCollectionPath(path);

  return pathSegments.length === collectionSegments.length + 1 &&
    hasSegmentPrefix(pathSegments, collectionSegments) &&
    typeof pathSegments[collectionSegments.length] === 'number';
}

function hasSegmentPrefix(
  segments: Array<number | string>,
  prefix: Array<number | string>,
): boolean {
  return prefix.every((segment, index) => segment === segments[index]);
}
