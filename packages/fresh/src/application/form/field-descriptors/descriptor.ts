import type {
  CollectionKeyMap,
  ControlProps,
  FieldConstraints,
  FieldDescriptor,
  FormFieldErrors,
  FormValues,
} from '../runtime/types.ts';
import {
  createFieldId,
  formatControlValue,
  mergeControlProps,
  mergeDescribedBy,
} from './aria-data.ts';
import { readConstraints } from './constraints.ts';

export interface CreateFieldDescriptorsOptions<TValues extends FormValues> {
  readonly formId: string;
  readonly values: TValues;
  readonly initialValues: Partial<TValues>;
  readonly defaultValues?: Partial<TValues>;
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly constraints?: Record<string, FieldConstraints>;
  readonly collectionKeys?: CollectionKeyMap;
}

export interface CreateDescriptorOptions {
  readonly formId: string;
  readonly path: string;
  readonly value: unknown;
  readonly initialValue: unknown;
  readonly defaultValue: unknown;
  readonly fieldErrors: Record<string, readonly string[] | undefined>;
  readonly constraints: Record<string, FieldConstraints>;
  readonly collectionKeys: CollectionKeyMap;
}

export function createFieldDescriptor(
  options: CreateDescriptorOptions,
): FieldDescriptor<unknown> {
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

export function readObjectValue(value: unknown, key: string): unknown {
  if (!isRecord(value)) {
    return undefined;
  }

  return value[key];
}

export function toFieldErrorRecord<TValues extends FormValues>(
  fieldErrors: FormFieldErrors<TValues>,
): Record<string, readonly string[] | undefined> {
  return fieldErrors as Record<string, readonly string[] | undefined>;
}

export function isArrayLike(...values: unknown[]): boolean {
  return values.some((value) => Array.isArray(value));
}

export function isObjectLike(...values: unknown[]): boolean {
  return values.some((value) => isRecord(value));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readErrors(
  path: string,
  fieldErrors: Record<string, readonly string[] | undefined>,
): readonly string[] {
  const direct = fieldErrors[path];
  return Array.isArray(direct) ? [...direct] : [];
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
