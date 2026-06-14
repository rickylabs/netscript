import { collectionIntent } from '../runtime/intent.ts';
import type {
  CollectionDescriptor,
  CollectionItem,
  CollectionKeyMap,
  FieldDescriptor,
  IntentButtonProps,
} from '../runtime/types.ts';
import type { CreateDescriptorOptions } from './descriptor.ts';

interface CollectionDescriptorFactories {
  readonly createFieldDescriptor: (
    options: CreateDescriptorOptions,
  ) => FieldDescriptor<unknown>;
  readonly createCollectionItemFields: (
    options: CreateDescriptorOptions,
  ) => CollectionItem<unknown>['fields'];
}

export function createCollectionDescriptor(
  options: CreateDescriptorOptions,
  factories: CollectionDescriptorFactories,
): CollectionDescriptor<unknown> & FieldDescriptor<unknown[]> {
  const base = factories.createFieldDescriptor(options) as FieldDescriptor<unknown[]>;
  const items = Array.isArray(options.value) ? options.value : [];
  const initialItems = Array.isArray(options.initialValue) ? options.initialValue : [];
  const defaultItems = Array.isArray(options.defaultValue) ? options.defaultValue : [];

  const occurrences = new Map<string, number>();
  const list = items.map((item, index) => {
    const itemPath = `${options.path}[${index}]`;
    const initialItem = initialItems[index];
    const defaultItem = defaultItems[index] ?? defaultItems[0];
    const submittedKey = readCollectionKey(itemPath, options.collectionKeys);
    const keySeed = submittedKey ?? createCollectionItemSeed(initialItem, item, defaultItem);
    const nextOccurrence = occurrences.get(keySeed) ?? 0;
    occurrences.set(keySeed, nextOccurrence + 1);

    return createCollectionItem(
      {
        ...options,
        path: itemPath,
        value: item,
        initialValue: initialItem,
        defaultValue: defaultItem,
      },
      factories,
      index,
      submittedKey ?? `seed:${keySeed}:${nextOccurrence}`,
    );
  });

  return {
    ...base,
    list,
    length: list.length,
    errors: base.errors,
    error: base.error,
    minItems: base.constraints.minItems,
    maxItems: base.constraints.maxItems,
    errorId: base.errorId,
    descriptionId: base.descriptionId,
    errorProps: base.errorProps,
    descriptionProps: base.descriptionProps,
    addButtonProps(init): IntentButtonProps {
      return createCollectionIntentButton('add', options.path, {
        defaultValue: init?.defaultValue,
      });
    },
    removeButtonProps(index: number): IntentButtonProps {
      return createCollectionIntentButton('remove', options.path, { index });
    },
    reorderButtonProps(from: number, to: number): IntentButtonProps {
      return createCollectionIntentButton('reorder', options.path, { from, to });
    },
    duplicateButtonProps(index: number): IntentButtonProps {
      return createCollectionIntentButton('duplicate', options.path, { index });
    },
  };
}

export function cloneCollectionKeys(collectionKeys: CollectionKeyMap): CollectionKeyMap {
  return Object.fromEntries(Object.entries(collectionKeys));
}

function createCollectionItem(
  options: CreateDescriptorOptions,
  factories: CollectionDescriptorFactories,
  index: number,
  key: string,
): CollectionItem<unknown> {
  return {
    key,
    index,
    keyInputProps: {
      type: 'hidden',
      name: `${options.path}.__key`,
      value: key,
      form: options.formId,
    },
    fields: factories.createCollectionItemFields(options),
  };
}

function createCollectionItemSeed(...values: unknown[]): string {
  for (const value of values) {
    if (value !== undefined) {
      return stableSerialize(value);
    }
  }

  return 'empty';
}

function createCollectionIntentButton(
  action: 'add' | 'duplicate' | 'remove' | 'reorder',
  name: string,
  payload: Record<string, unknown>,
): IntentButtonProps {
  return {
    type: 'submit',
    name: '__intent__',
    value: collectionIntent(action, name, payload),
    formNoValidate: true,
    'data-intent': `collection:${action}`,
    'data-collection-name': name,
    'data-collection-index': toCollectionIndex(payload),
  };
}

function readCollectionKey(path: string, collectionKeys: CollectionKeyMap): string | undefined {
  const value = collectionKeys[path];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function toCollectionIndex(payload: Record<string, unknown>): string | undefined {
  for (const key of ['index', 'from', 'to']) {
    const value = payload[key];
    if (typeof value === 'number' && Number.isInteger(value)) {
      return String(value);
    }
  }

  return undefined;
}

function stableSerialize(value: unknown): string {
  return stableSerializeWithSeen(value, new WeakSet<object>());
}

function stableSerializeWithSeen(value: unknown, seen: WeakSet<object>): string {
  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'string') {
    return `string:${value}`;
  }

  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return `${typeof value}:${String(value)}`;
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return '[Circular]';
    }

    seen.add(value);
    const serialized = `[${value.map((entry) => stableSerializeWithSeen(entry, seen)).join(',')}]`;
    seen.delete(value);
    return serialized;
  }

  if (isRecord(value)) {
    if (seen.has(value)) {
      return '[Circular]';
    }

    seen.add(value);
    const serialized = `{${
      Object.keys(value).sort().map((key) => `${key}:${stableSerializeWithSeen(value[key], seen)}`)
        .join(',')
    }}`;
    seen.delete(value);
    return serialized;
  }

  return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
