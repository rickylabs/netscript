import type { CollectionKeyMap } from './types.ts';

export const COLLECTION_KEY_FIELD_NAME = '__key';

export function extractCollectionKeys(value: unknown): CollectionKeyMap {
  const collectionKeys: CollectionKeyMap = {};
  collectCollectionKeys(value, '', collectionKeys);
  return collectionKeys;
}

export function omitCollectionKeyFields<T>(value: T): T {
  return omitCollectionKeyValue(value) as T;
}

function collectCollectionKeys(
  value: unknown,
  path: string,
  collectionKeys: CollectionKeyMap,
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectCollectionKeys(entry, `${path}[${index}]`, collectionKeys);
    });
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  const keyValue = value[COLLECTION_KEY_FIELD_NAME];
  if (typeof keyValue === 'string' && path.length > 0) {
    collectionKeys[path] = keyValue;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (key === COLLECTION_KEY_FIELD_NAME) {
      continue;
    }

    const nextPath = path.length > 0 ? `${path}.${key}` : key;
    collectCollectionKeys(entry, nextPath, collectionKeys);
  }
}

function omitCollectionKeyValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => omitCollectionKeyValue(entry));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== COLLECTION_KEY_FIELD_NAME)
      .map(([key, entry]) => [key, omitCollectionKeyValue(entry)]),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
