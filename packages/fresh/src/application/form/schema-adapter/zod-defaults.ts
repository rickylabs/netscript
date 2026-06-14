import { z } from 'zod';
import type { FormValues } from '../runtime/types.ts';
import { innerTypeOf, readTupleItems, unwrapOptionalLike, unwrapSchema } from './zod-internals.ts';

export function resolveZodDefaults<TValues extends FormValues>(
  schema: z.ZodTypeAny,
): Partial<TValues> {
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

function readDefaultValue(schema: z.ZodDefault | z.ZodPrefault): unknown {
  const def = schema._def as { readonly defaultValue: unknown };
  return typeof def.defaultValue === 'function'
    ? (def.defaultValue as () => unknown)()
    : def.defaultValue;
}
