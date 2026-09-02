import { z } from 'zod';
import type { FieldConstraints } from '../runtime/types.ts';
import { isRequired, unwrapSchema } from './zod-internals.ts';

type MutableFieldConstraints = {
  -readonly [K in keyof FieldConstraints]?: FieldConstraints[K];
};

export function collectConstraints(
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
      case 'min_length': {
        const minimum = readCheckNumber(check, 'minimum');
        if (minimum !== undefined) {
          constraints.minLength = minimum;
        }
        break;
      }
      case 'max':
      case 'max_length': {
        const maximum = readCheckNumber(check, 'maximum');
        if (maximum !== undefined) {
          constraints.maxLength = maximum;
        }
        break;
      }
      case 'length': {
        const length = readCheckNumber(check, 'length');
        if (length !== undefined) {
          constraints.minLength = length;
          constraints.maxLength = length;
        }
        break;
      }
      case 'regex':
        if (check.regex instanceof RegExp) {
          constraints.pattern = check.regex.source;
        }
        break;
      case 'string_format': {
        if (check.format === 'url') {
          constraints.pattern = URL_PATTERN.source;
        } else if (readCheckString(check, 'format') === 'regex') {
          const pattern = readCheckRegExp(check, 'pattern');
          if (pattern !== undefined) {
            constraints.pattern = pattern.source;
          }
        }
        break;
      }
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
      case 'min_length': {
        const minimum = readCheckNumber(check, 'minimum');
        if (minimum !== undefined) {
          constraints.minItems = minimum;
        }
        break;
      }
      case 'max':
      case 'max_length': {
        const maximum = readCheckNumber(check, 'maximum');
        if (maximum !== undefined) {
          constraints.maxItems = maximum;
        }
        break;
      }
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
      case 'min': {
        const minimum = readCheckNumber(check, 'minimum');
        if (minimum !== undefined) {
          constraints.min = minimum;
        }
        break;
      }
      case 'greater_than': {
        const minimum = readCheckNumber(check, 'value');
        if (readCheckBoolean(check, 'inclusive') === true && minimum !== undefined) {
          constraints.min = minimum;
        }
        break;
      }
      case 'max': {
        const maximum = readCheckNumber(check, 'maximum');
        if (maximum !== undefined) {
          constraints.max = maximum;
        }
        break;
      }
      case 'less_than': {
        const maximum = readCheckNumber(check, 'value');
        if (readCheckBoolean(check, 'inclusive') === true && maximum !== undefined) {
          constraints.max = maximum;
        }
        break;
      }
      case 'multipleOf':
      case 'multiple_of': {
        const multipleOf = readCheckNumber(check, 'value');
        if (multipleOf !== undefined) {
          constraints.step = multipleOf;
        }
        break;
      }
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
  const value = readCheckDefinition(check)?.check;

  if (typeof value === 'string') {
    return value;
  }

  if (typeof check.kind === 'string') {
    return check.kind;
  }

  if (typeof check.check === 'string') {
    return check.check;
  }

  return undefined;
}

function readCheckDefinition(check: Record<string, unknown>): Record<string, unknown> | undefined {
  const value = check._zod;
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const definition = (value as { def?: unknown }).def;
  return typeof definition === 'object' && definition !== null
    ? definition as Record<string, unknown>
    : undefined;
}

function readCheckBoolean(
  check: Record<string, unknown>,
  key: 'inclusive',
): boolean | undefined {
  const direct = check[key];
  if (typeof direct === 'boolean') {
    return direct;
  }

  const nested = readCheckDefinition(check)?.[key];
  return typeof nested === 'boolean' ? nested : undefined;
}

function readCheckRegExp(
  check: Record<string, unknown>,
  key: 'pattern',
): RegExp | undefined {
  const direct = check[key];
  if (direct instanceof RegExp) {
    return direct;
  }

  const nested = readCheckDefinition(check)?.[key];
  return nested instanceof RegExp ? nested : undefined;
}

function readCheckString(
  check: Record<string, unknown>,
  key: 'format',
): string | undefined {
  const direct = check[key];
  if (typeof direct === 'string') {
    return direct;
  }

  const nested = readCheckDefinition(check)?.[key];
  return typeof nested === 'string' ? nested : undefined;
}

function readCheckNumber(
  check: Record<string, unknown>,
  key: 'length' | 'maximum' | 'minimum' | 'value',
): number | undefined {
  const direct = check[key];
  if (typeof direct === 'number') {
    return direct;
  }

  const nested = readCheckDefinition(check)?.[key];
  return typeof nested === 'number' ? nested : undefined;
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
