import type { StandardSchemaV1 } from '@standard-schema/spec';

/** JSON Schema object exposed by MCP tool metadata. */
export type JsonSchema = Readonly<Record<string, unknown>>;

/** Standard Schema contract carrying its MCP JSON Schema representation. */
export interface ToolSchema<T> extends StandardSchemaV1<unknown, T> {
  /** JSON Schema advertised through MCP tool metadata. */
  readonly jsonSchema: JsonSchema;
}

/** Create a synchronous Standard Schema contract from a type guard. */
export function createToolSchema<T>(
  jsonSchema: JsonSchema,
  isValue: (value: unknown) => value is T,
  message: string,
): ToolSchema<T> {
  return {
    jsonSchema,
    '~standard': {
      version: 1,
      vendor: '@netscript/mcp',
      validate(value: unknown): StandardSchemaV1.Result<T> {
        const issues = isValue(value) ? validateJsonSchema(jsonSchema, value) : [message];
        return issues.length === 0
          ? { value: value as T }
          : { issues: issues.map((issue) => ({ message: issue })) };
      },
    },
  };
}

function validateJsonSchema(schema: JsonSchema, value: unknown, path = '$'): string[] {
  const issues: string[] = [];
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    issues.push(`${path} must be one of ${schema.enum.join(', ')}`);
  }
  const type = schema.type;
  if (type === 'object') {
    if (!isRecord(value)) return [`${path} must be an object`];
    const required = Array.isArray(schema.required) ? schema.required : [];
    for (const key of required) {
      if (!(key in value)) issues.push(`${path}.${String(key)} is required`);
    }
    const properties = isRecord(schema.properties) ? schema.properties : {};
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) issues.push(`${path}.${key} is not allowed`);
      }
    }
    for (const [key, child] of Object.entries(properties)) {
      if (key in value && isRecord(child)) {
        issues.push(...validateJsonSchema(child, value[key], `${path}.${key}`));
      }
    }
  } else if (type === 'array') {
    if (!Array.isArray(value)) return [`${path} must be an array`];
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
      issues.push(`${path} must contain at most ${schema.maxItems} items`);
    }
    if (isRecord(schema.items)) {
      value.forEach((item, index) =>
        issues.push(...validateJsonSchema(schema.items as JsonSchema, item, `${path}[${index}]`))
      );
    }
  } else if (type === 'string' && typeof value !== 'string') {
    issues.push(`${path} must be a string`);
  } else if (type === 'number' && typeof value !== 'number') {
    issues.push(`${path} must be a number`);
  } else if (type === 'integer' && !Number.isInteger(value)) {
    issues.push(`${path} must be an integer`);
  } else if (type === 'boolean' && typeof value !== 'boolean') {
    issues.push(`${path} must be a boolean`);
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      issues.push(`${path} must be at least ${schema.minimum}`);
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      issues.push(`${path} must be at most ${schema.maximum}`);
    }
  }
  return issues;
}

/** Return whether a value is a JSON-like record. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validate a value with a synchronous tool schema. */
export function validateSchema<T>(schema: ToolSchema<T>, value: unknown): T {
  const result = schema['~standard'].validate(value);
  if (result instanceof Promise) throw new Error('Asynchronous schemas are not supported');
  if (result.issues) throw new Error(result.issues.map((issue) => issue.message).join('; '));
  return result.value;
}
