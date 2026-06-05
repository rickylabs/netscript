import { collectionIntent } from './intent.ts';
import { parseFormPath } from './pipeline.ts';
import type {
  CollectionDescriptor,
  CollectionItem,
  CollectionKeyMap,
  ControlProps,
  FieldConstraints,
  FieldDescriptor,
  FieldDescriptorMap,
  FormFieldErrors,
  FormValues,
  IntentButtonProps,
} from './types.ts';

interface CreateFieldDescriptorsOptions<TValues extends FormValues> {
  readonly formId: string;
  readonly values: TValues;
  readonly initialValues: Partial<TValues>;
  readonly defaultValues?: Partial<TValues>;
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly constraints?: Record<string, FieldConstraints>;
  readonly collectionKeys?: CollectionKeyMap;
}

interface CreateDescriptorOptions {
  readonly formId: string;
  readonly path: string;
  readonly value: unknown;
  readonly initialValue: unknown;
  readonly defaultValue: unknown;
  readonly fieldErrors: Record<string, readonly string[] | undefined>;
  readonly constraints: Record<string, FieldConstraints>;
  readonly collectionKeys: CollectionKeyMap;
}

/**
 * Build the runtime field-descriptor tree for a resolved form state.
 */
export function createFieldDescriptors<TValues extends FormValues>(
  options: CreateFieldDescriptorsOptions<TValues>,
): FieldDescriptorMap<TValues> {
  const constraints = cloneConstraints(options.constraints ?? {});
  const fieldErrors = toFieldErrorRecord(options.fieldErrors);
  const fields = createObjectDescriptorMap({
    formId: options.formId,
    path: '',
    value: options.values,
    initialValue: options.initialValues,
    defaultValue: options.defaultValues,
    fieldErrors,
    constraints,
    collectionKeys: cloneCollectionKeys(options.collectionKeys ?? {}),
  });

  return fields as FieldDescriptorMap<TValues>;
}

function createObjectDescriptorMap(options: CreateDescriptorOptions): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  for (
    const key of collectChildKeys(
      options.path,
      options.value,
      options.initialValue,
      options.defaultValue,
      options.constraints,
    )
  ) {
    const nextPath = options.path ? `${options.path}.${key}` : key;
    fields[key] = createDescriptorNode({
      ...options,
      path: nextPath,
      value: readObjectValue(options.value, key),
      initialValue: readObjectValue(options.initialValue, key),
      defaultValue: readObjectValue(options.defaultValue, key),
    });
  }

  return fields;
}

function createDescriptorNode(options: CreateDescriptorOptions): unknown {
  if (isArrayLike(options.value, options.initialValue, options.defaultValue)) {
    return createCollectionDescriptor(options);
  }

  const descriptor = createFieldDescriptor(options);

  if (isObjectLike(options.value, options.initialValue, options.defaultValue)) {
    return {
      ...createObjectDescriptorMap(options),
      ...descriptor,
    };
  }

  return descriptor;
}

function createFieldDescriptor(options: CreateDescriptorOptions): FieldDescriptor<unknown> {
  const constraints = readConstraints(options.path, options.constraints);
  const errors = readErrors(options.path, options.fieldErrors);
  const id = createFieldId(options.formId, options.path);
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;
  const value = options.value;
  const initialValue = options.initialValue;
  const defaultValue = options.defaultValue;
  const dirty = !areValuesEqual(value, initialValue);
  const required = constraints.required === true;

  return {
    name: options.path,
    id,
    key: id,
    formId: options.formId,
    value,
    initialValue,
    defaultValue,
    errors,
    error: errors[0],
    invalid: errors.length > 0,
    valid: errors.length === 0,
    required,
    dirty,
    constraints,
    errorId,
    descriptionId,
    controlProps<TOverrides extends Record<string, unknown> = Record<string, never>>(
      overrides?: TOverrides,
    ): ControlProps & TOverrides {
      const resolvedOverrides = (overrides ?? {}) as TOverrides;
      const describedBy = mergeDescribedBy(
        errors.length > 0 ? errorId : undefined,
        resolvedOverrides['aria-describedby'],
      );
      const resolvedValue = value ?? defaultValue;
      const valueProps: Partial<ControlProps> = typeof resolvedValue === 'boolean'
        ? { defaultChecked: resolvedValue }
        : (() => {
          const formattedValue = formatControlValue(resolvedValue);
          return formattedValue !== undefined ? { defaultValue: formattedValue } : {};
        })();
      const props: ControlProps = {
        id,
        name: options.path,
        form: options.formId,
        'aria-invalid': errors.length > 0 ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required ? true : undefined,
        required: required ? true : undefined,
        minLength: constraints.minLength,
        maxLength: constraints.maxLength,
        min: constraints.min,
        max: constraints.max,
        pattern: constraints.pattern,
        step: constraints.step,
        multiple: constraints.multiple,
        'data-field-path': options.path,
        'data-field-invalid': errors.length > 0 ? 'true' : 'false',
        'data-field-dirty': dirty ? 'true' : 'false',
        'data-form-id': options.formId,
        ...valueProps,
      };

      return mergeControlProps(props, resolvedOverrides);
    },
    labelProps: { for: id },
    errorProps: { id: errorId, role: 'alert', 'aria-live': 'polite' },
    descriptionProps: { id: descriptionId },
  };
}

function createCollectionDescriptor(
  options: CreateDescriptorOptions,
): CollectionDescriptor<unknown> & FieldDescriptor<unknown[]> {
  const base = createFieldDescriptor(options) as FieldDescriptor<unknown[]>;
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

    return createCollectionItem({
      ...options,
      path: itemPath,
      value: item,
      initialValue: initialItem,
      defaultValue: defaultItem,
    }, index, submittedKey ?? `seed:${keySeed}:${nextOccurrence}`);
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

function createCollectionItem(
  options: CreateDescriptorOptions,
  index: number,
  key: string,
): CollectionItem<unknown> {
  const fields = isObjectLike(options.value, options.initialValue, options.defaultValue)
    ? createObjectDescriptorMap(options)
    : createFieldDescriptor(options);

  return {
    key,
    index,
    keyInputProps: {
      type: 'hidden',
      name: `${options.path}.__key`,
      value: key,
      form: options.formId,
    },
    fields: fields as CollectionItem<unknown>['fields'],
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

function collectChildKeys(
  path: string,
  value: unknown,
  initialValue: unknown,
  defaultValue: unknown,
  constraints: Record<string, FieldConstraints>,
): string[] {
  const keys = new Set<string>();

  for (const source of [value, initialValue, defaultValue]) {
    if (isRecord(source)) {
      for (const key of Object.keys(source)) {
        if (key === '__key') {
          continue;
        }
        keys.add(key);
      }
    }
  }

  const normalizedPath = normalizeConstraintPath(path);
  const pathSegments = normalizedPath ? parseFormPath(normalizedPath) : [];

  for (const constraintPath of Object.keys(constraints)) {
    const constraintSegments = parseFormPath(normalizeConstraintPath(constraintPath));
    if (!hasSegmentPrefix(constraintSegments, pathSegments)) {
      continue;
    }

    const nextSegment = constraintSegments[pathSegments.length];
    if (typeof nextSegment === 'string') {
      keys.add(nextSegment);
    }
  }

  return [...keys].sort();
}

function readObjectValue(value: unknown, key: string): unknown {
  if (!isRecord(value)) {
    return undefined;
  }

  return value[key];
}

function readConstraints(path: string, constraints: Record<string, FieldConstraints>): FieldConstraints {
  const direct = constraints[path];
  if (direct) {
    return direct;
  }

  const normalized = constraints[normalizeConstraintPath(path)];
  return normalized ?? {};
}

function readErrors(
  path: string,
  fieldErrors: Record<string, readonly string[] | undefined>,
): readonly string[] {
  const direct = fieldErrors[path];
  return Array.isArray(direct) ? [...direct] : [];
}

function createFieldId(formId: string, path: string): string {
  const sanitizedPath = path
    .replaceAll('.', '-')
    .replaceAll('[', '-')
    .replaceAll(']', '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return sanitizedPath ? `${formId}-${sanitizedPath}` : formId;
}

function mergeControlProps<TOverrides extends Record<string, unknown>>(
  base: ControlProps,
  overrides: TOverrides,
): ControlProps & TOverrides {
  return {
    ...base,
    ...overrides,
    'aria-describedby': mergeDescribedBy(
      base['aria-describedby'],
      overrides['aria-describedby'],
    ),
  } as ControlProps & TOverrides;
}

function mergeDescribedBy(
  base: unknown,
  override: unknown,
): string | undefined {
  const values = [
    typeof base === 'string' ? base : undefined,
    typeof override === 'string' ? override : undefined,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  return values.length > 0 ? [...new Set(values.flatMap((value) => value.split(/\s+/)))].join(' ') : undefined;
}

function formatControlValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  return undefined;
}

function areValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length &&
      left.every((value, index) => areValuesEqual(value, right[index]));
  }

  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    const rightKeySet = new Set(rightKeys);
    return leftKeys.every((key) => rightKeySet.has(key) && areValuesEqual(left[key], right[key]));
  }

  return false;
}

function cloneConstraints(
  constraints: Record<string, FieldConstraints>,
): Record<string, FieldConstraints> {
  return Object.fromEntries(
    Object.entries(constraints).map(([key, value]) => [key, { ...value }]),
  );
}

function cloneCollectionKeys(collectionKeys: CollectionKeyMap): CollectionKeyMap {
  return Object.fromEntries(Object.entries(collectionKeys));
}

function normalizeConstraintPath(path: string): string {
  return path.replace(/\[\d+\]/g, '[0]');
}

function toFieldErrorRecord<TValues extends FormValues>(
  fieldErrors: FormFieldErrors<TValues>,
): Record<string, readonly string[] | undefined> {
  return fieldErrors as Record<string, readonly string[] | undefined>;
}

function readCollectionKey(path: string, collectionKeys: CollectionKeyMap): string | undefined {
  const value = collectionKeys[path];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function hasSegmentPrefix(
  segments: Array<number | string>,
  prefix: Array<number | string>,
): boolean {
  return prefix.every((segment, index) => segment === segments[index]);
}

function isArrayLike(...values: unknown[]): boolean {
  return values.some((value) => Array.isArray(value));
}

function isObjectLike(...values: unknown[]): boolean {
  return values.some((value) => isRecord(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
    const serialized =
      `{${Object.keys(value).sort().map((key) => `${key}:${stableSerializeWithSeen(value[key], seen)}`).join(',')}}`;
    seen.delete(value);
    return serialized;
  }

  return String(value);
}
