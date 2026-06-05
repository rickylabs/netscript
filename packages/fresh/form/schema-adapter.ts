/**
 * Canonical schema adapter surface for `@netscript/fresh` forms.
 *
 * This module establishes the framework-owned validation boundary described by
 * RFC 15. The first shipped adapter is Zod-first, but the contract is adapter-
 * shaped so future schema systems can integrate without forcing a rewrite of
 * the form runtime.
 *
 * The adapter owns four responsibilities:
 *
 * - parsing unknown submitted values into typed output
 * - flattening validation failures into the canonical form error shape
 * - extracting safe HTML constraint metadata
 * - deriving default values when the schema exposes them
 *
 * The implementation intentionally avoids leaking Zod internals beyond this
 * module's public adapter contract.
 *
 * @module
 */

import { z } from 'zod';
import type { FieldConstraints, FormFieldErrors, FormValues } from './types.ts';

type FlattenedFieldErrors = {
  readonly fieldErrors: Record<string, readonly string[] | undefined>;
  readonly formErrors: readonly string[];
};

type MutableFieldConstraints = {
  -readonly [K in keyof FieldConstraints]?: FieldConstraints[K];
};

type ZodDefWithInner = {
  readonly innerType?: z.ZodTypeAny;
  readonly schema?: z.ZodTypeAny;
  readonly in?: z.ZodTypeAny;
  readonly out?: z.ZodTypeAny;
  readonly items?: readonly z.ZodTypeAny[];
};

/**
 * Successful schema parse result.
 */
export interface FormSchemaParseSuccess<TOutput> {
  readonly success: true;
  readonly data: TOutput;
}

/**
 * Failed schema parse result normalized for the form runtime.
 */
export interface FormSchemaParseFailure<TValues extends FormValues> {
  readonly success: false;
  readonly fieldErrors: FormFieldErrors<TValues>;
  readonly formErrors: readonly string[];
}

/**
 * Adapter-safe parse result used by the canonical form runtime.
 */
export type FormSchemaParseResult<TValues extends FormValues, TOutput> =
  | FormSchemaParseSuccess<TOutput>
  | FormSchemaParseFailure<TValues>;

/**
 * Validation boundary abstraction for forms.
 *
 * `TValues` represents the submitted/raw form values shape used by the page and
 * field metadata layers.
 *
 * `TOutput` represents the validated/coerced output shape produced by the
 * schema. For Zod this commonly maps to `z.output<TSchema>`.
 */
export interface FormSchemaAdapter<TValues extends FormValues, TOutput = TValues> {
  /**
   * Parse and validate unknown input, throwing on failure.
   */
  parse(input: unknown): Promise<TOutput>;

  /**
   * Parse and validate unknown input, returning a normalized success/failure
   * result that the form runtime can consume directly.
   */
  safeParse(input: unknown): Promise<FormSchemaParseResult<TValues, TOutput>>;

  /**
   * Extract safe HTML constraint metadata from the schema.
   *
   * This intentionally returns a plain keyed record so downstream field
   * descriptor builders can decide how to materialize nested field paths later.
   */
  getConstraints(): Partial<Record<string, FieldConstraints>>;

  /**
   * Best-effort default values derived from schema defaults.
   *
   * If the schema cannot be evaluated into defaults, this returns an empty
   * object rather than throwing.
   */
  getDefaults(): Partial<TValues>;
}

/**
 * Create a canonical form schema adapter from a Zod schema.
 */
export function createZodAdapter<
  TSchema extends z.ZodTypeAny,
  TValues extends FormValues = z.input<TSchema> & FormValues,
  TOutput = z.output<TSchema>,
>(schema: TSchema): FormSchemaAdapter<TValues, TOutput> {
  return {
    async parse(input: unknown): Promise<TOutput> {
      const result = await schema.safeParseAsync(input);

      if (!result.success) {
        throw result.error;
      }

      return result.data as TOutput;
    },

    async safeParse(input: unknown): Promise<FormSchemaParseResult<TValues, TOutput>> {
      const result = await schema.safeParseAsync(input);

      if (result.success) {
        return {
          success: true,
          data: result.data as TOutput,
        };
      }

      const normalized = normalizeZodFieldErrors<TValues>(
        z.flattenError(result.error) as FlattenedFieldErrors,
      );

      return {
        success: false,
        fieldErrors: normalized.fieldErrors,
        formErrors: normalized.formErrors,
      };
    },

    getConstraints(): Partial<Record<string, FieldConstraints>> {
      const constraints: Partial<Record<string, FieldConstraints>> = {};
      collectConstraints(schema, '', constraints);
      return constraints;
    },

    getDefaults(): Partial<TValues> {
      return resolveZodDefaults<TValues>(schema);
    },
  };
}

function normalizeZodFieldErrors<TValues extends FormValues>(
  flattened: FlattenedFieldErrors,
): {
  fieldErrors: FormFieldErrors<TValues>;
  formErrors: readonly string[];
} {
  const fieldErrors = createEmptyFieldErrors<TValues>();

  for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
    if (!Array.isArray(messages) || messages.length === 0) {
      continue;
    }

    fieldErrors[field as Extract<keyof TValues, string>] = [...messages] as FormFieldErrors<
      TValues
    >[Extract<keyof TValues, string>];
  }

  const formErrors = [...flattened.formErrors];
  if (formErrors.length > 0) {
    fieldErrors._form = [...formErrors];
  }

  return {
    fieldErrors,
    formErrors,
  };
}

function createEmptyFieldErrors<TValues extends FormValues>(): FormFieldErrors<TValues> {
  return { _form: [] } as FormFieldErrors<TValues>;
}

function resolveZodDefaults<TValues extends FormValues>(schema: z.ZodTypeAny): Partial<TValues> {
  const value = resolveDefaultValue(schema);

  if (value === undefined || typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {} as Partial<TValues>;
  }

  return value as Partial<TValues>;
}

function resolveDefaultValue(schema: z.ZodTypeAny): unknown {
  const explicitDefaultValue = readExplicitDefaultValue(schema);
  if (explicitDefaultValue !== undefined) {
    return explicitDefaultValue;
  }

  const unwrapped = unwrapSchema(schema);

  if (unwrapped instanceof z.ZodObject) {
    const shape = unwrapped.shape;
    const entries = Object.entries(shape);
    const result: Record<string, unknown> = {};
    let hasDefaults = false;

    for (const [key, valueSchema] of entries) {
      const value = resolveDefaultValue(valueSchema);

      if (value !== undefined) {
        result[key] = value;
        hasDefaults = true;
      }
    }

    return hasDefaults ? result : undefined;
  }

  if (unwrapped instanceof z.ZodArray) {
    const defaultElement = resolveDefaultValue(unwrapped.element as z.ZodTypeAny);
    return defaultElement === undefined ? undefined : [defaultElement];
  }

  if (unwrapped instanceof z.ZodTuple) {
    const items = readTupleItems(unwrapped)
      .map((item: z.ZodTypeAny) => resolveDefaultValue(item));

    return items.some((item) => item !== undefined) ? items : undefined;
  }

  return undefined;
}

function readExplicitDefaultValue(schema: z.ZodTypeAny): unknown {
  let current = schema;

  while (true) {
    if (current instanceof z.ZodDefault || current instanceof z.ZodPrefault) {
      return cloneDefaultValue(readDefaultValue(current));
    }

    if (
      current instanceof z.ZodCatch || current instanceof z.ZodReadonly ||
      current instanceof z.ZodNonOptional || current instanceof z.ZodPipe ||
      current instanceof z.ZodTransform
    ) {
      const inner = innerTypeOf(current);
      if (inner === current) {
        return undefined;
      }

      current = inner;
      continue;
    }

    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
      const inner = unwrapOptionalLike(current);
      if (inner === current) {
        return undefined;
      }

      current = inner;
      continue;
    }

    return undefined;
  }
}

function cloneDefaultValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneDefaultValue(entry)) as T;
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneDefaultValue(entry)]),
    ) as T;
  }

  return value;
}

function collectConstraints(
  schema: z.ZodTypeAny,
  path: string,
  constraints: Partial<Record<string, FieldConstraints>>,
): void {
  const unwrapped = unwrapSchema(schema);

  if (unwrapped instanceof z.ZodObject) {
    const shape = unwrapped.shape;

    for (const [key, childSchema] of Object.entries(shape)) {
      const childPath = path === '' ? key : `${path}.${key}`;
      collectConstraints(childSchema, childPath, constraints);
    }

    return;
  }

  if (unwrapped instanceof z.ZodArray) {
    const nextPath = path === '' ? '[0]' : `${path}[0]`;
    const arrayConstraints = constraints[path] ?? {};
    const mergedArrayConstraints = mergeConstraints(
      arrayConstraints,
      extractChecks(unwrapped, schema),
    );

    if (hasConstraintValues(mergedArrayConstraints)) {
      constraints[path] = mergedArrayConstraints;
    }

    collectConstraints(unwrapped.element as z.ZodTypeAny, nextPath, constraints);
    return;
  }

  const merged = mergeConstraints(
    constraints[path] ?? {},
    extractChecks(unwrapped, schema),
  );

  if (path !== '' && hasConstraintValues(merged)) {
    constraints[path] = merged;
  }
}

function extractChecks(unwrapped: z.ZodTypeAny, original: z.ZodTypeAny): FieldConstraints {
  const constraints: MutableFieldConstraints = {};
  const required = isRequired(original);

  constraints.required = required;

  if (unwrapped instanceof z.ZodString) {
    applyStringChecks(unwrapped, constraints);
  } else if (unwrapped instanceof z.ZodArray) {
    applyArrayChecks(unwrapped, constraints);
  } else if (unwrapped instanceof z.ZodNumber) {
    applyNumberChecks(unwrapped, constraints);
  } else if (unwrapped instanceof z.ZodEnum) {
    constraints.required = required;
  }

  return constraints as FieldConstraints;
}

function applyStringChecks(schema: z.ZodString, constraints: MutableFieldConstraints): void {
  if (typeof schema.minLength === 'number') {
    constraints.minLength = schema.minLength;
  }

  if (typeof schema.maxLength === 'number') {
    constraints.maxLength = schema.maxLength;
  }

  const checks = readChecks(schema);

  for (const check of checks) {
    const kind = readCheckKind(check);

    switch (kind) {
      case 'min':
      case 'min_length':
        const minimum = readCheckNumber(check, 'minimum');
        if (minimum !== undefined) {
          constraints.minLength = minimum;
        }
        break;
      case 'max':
      case 'max_length':
        const maximum = readCheckNumber(check, 'maximum');
        if (maximum !== undefined) {
          constraints.maxLength = maximum;
        }
        break;
      case 'length':
        const length = readCheckNumber(check, 'length');
        if (length !== undefined) {
          constraints.minLength = length;
          constraints.maxLength = length;
        }
        break;
      case 'regex':
        if (check.regex instanceof RegExp) {
          constraints.pattern = check.regex.source;
        }
        break;
      case 'string_format':
        if (typeof check.format === 'string' && check.format === 'url') {
          constraints.pattern = URL_PATTERN.source;
        }
        break;
      default:
        break;
    }
  }
}

function applyArrayChecks(schema: z.ZodArray, constraints: MutableFieldConstraints): void {
  const checks = readChecks(schema);

  for (const check of checks) {
    const kind = readCheckKind(check);

    switch (kind) {
      case 'min':
      case 'min_length':
        const minimum = readCheckNumber(check, 'minimum');
        if (minimum !== undefined) {
          constraints.minItems = minimum;
        }
        break;
      case 'max':
      case 'max_length':
        const maximum = readCheckNumber(check, 'maximum');
        if (maximum !== undefined) {
          constraints.maxItems = maximum;
        }
        break;
      default:
        break;
    }
  }
}

function applyNumberChecks(schema: z.ZodNumber, constraints: MutableFieldConstraints): void {
  const checks = readChecks(schema);

  for (const check of checks) {
    const kind = readCheckKind(check);

    switch (kind) {
      case 'min':
        const minimum = readCheckNumber(check, 'minimum');
        if (minimum !== undefined) {
          constraints.min = minimum;
        }
        break;
      case 'max':
        const maximum = readCheckNumber(check, 'maximum');
        if (maximum !== undefined) {
          constraints.max = maximum;
        }
        break;
      case 'multipleOf':
        const multipleOf = readCheckNumber(check, 'value');
        if (multipleOf !== undefined) {
          constraints.step = multipleOf;
        }
        break;
      default:
        break;
    }
  }
}

function readChecks(schema: z.ZodTypeAny): Array<Record<string, unknown>> {
  const def = schema._def as { checks?: Array<Record<string, unknown>> };
  return Array.isArray(def.checks) ? def.checks : [];
}

function readCheckKind(check: Record<string, unknown>): string | undefined {
  const value = check._zod as { def?: { check?: unknown; format?: unknown } } | undefined;

  if (typeof value?.def?.check === 'string') {
    return value.def.check;
  }

  if (typeof check.kind === 'string') {
    return check.kind;
  }

  if (typeof check.check === 'string') {
    return check.check;
  }

  return undefined;
}

function readCheckNumber(
  check: Record<string, unknown>,
  key: 'length' | 'maximum' | 'minimum' | 'value',
): number | undefined {
  const direct = check[key];
  if (typeof direct === 'number') {
    return direct;
  }

  const nested = (check._zod as { def?: Record<string, unknown> } | undefined)?.def?.[key];
  return typeof nested === 'number' ? nested : undefined;
}

function isRequired(schema: z.ZodTypeAny): boolean {
  if (schema instanceof z.ZodDefault || schema instanceof z.ZodPrefault) {
    return false;
  }

  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return false;
  }

  if (
    schema instanceof z.ZodCatch || schema instanceof z.ZodReadonly ||
    schema instanceof z.ZodNonOptional || schema instanceof z.ZodPipe ||
    schema instanceof z.ZodTransform
  ) {
    return isRequired(innerTypeOf(schema));
  }

  return true;
}

function unwrapSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;

  while (true) {
    if (
      current instanceof z.ZodCatch || current instanceof z.ZodReadonly ||
      current instanceof z.ZodNonOptional || current instanceof z.ZodPipe ||
      current instanceof z.ZodTransform || current instanceof z.ZodDefault ||
      current instanceof z.ZodPrefault
    ) {
      current = innerTypeOf(current);
      continue;
    }

    if (current instanceof z.ZodOptional || current instanceof z.ZodNullable) {
      current = unwrapOptionalLike(current);
      continue;
    }

    return current;
  }
}

function innerTypeOf(schema: z.ZodTypeAny): z.ZodTypeAny {
  const def = schema._def as ZodDefWithInner;

  return def.schema ?? def.innerType ?? def.in ?? def.out ?? schema;
}

function mergeConstraints(base: FieldConstraints, next: FieldConstraints): FieldConstraints {
  return {
    ...base,
    ...next,
  };
}

function hasConstraintValues(constraints: FieldConstraints): boolean {
  return Object.values(constraints).some((value) => value !== undefined);
}

const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

function readDefaultValue(schema: z.ZodDefault | z.ZodPrefault): unknown {
  const def = schema._def as { readonly defaultValue: unknown };
  return typeof def.defaultValue === 'function'
    ? (def.defaultValue as () => unknown)()
    : def.defaultValue;
}

function readTupleItems(schema: z.ZodTuple): readonly z.ZodTypeAny[] {
  const def = schema._def as unknown as ZodDefWithInner;
  return Array.isArray(def.items) ? def.items : [];
}

function unwrapOptionalLike(schema: z.ZodOptional | z.ZodNullable): z.ZodTypeAny {
  const def = schema._def as unknown as ZodDefWithInner;
  return def.innerType ?? schema;
}
