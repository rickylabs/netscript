/** Contract-derived input witnesses for the generated service-client E2E probe. */

interface DerivableInputSchema {
  parse(value: unknown): unknown;
  toJSONSchema(options?: { readonly io?: 'input' | 'output' }): unknown;
}

/** Derive and validate a deterministic witness from one real procedure input schema. */
export function deriveProcedureInput<T>(inputSchema: unknown, label: string): T;
export function deriveProcedureInput(inputSchema: unknown, label: string): unknown {
  if (!isDerivableInputSchema(inputSchema)) {
    throw new Error(`${label} did not expose a Zod-compatible input schema`);
  }
  let jsonSchema: unknown;
  try {
    jsonSchema = inputSchema.toJSONSchema({ io: 'input' });
  } catch (error) {
    throw new Error(`${label} input schema could not produce JSON Schema`, { cause: error });
  }
  const candidate = jsonSchemaWitness(jsonSchema, label);
  try {
    return inputSchema.parse(candidate);
  } catch (error) {
    throw new Error(`${label} rejected its derived input ${JSON.stringify(candidate)}`, {
      cause: error,
    });
  }
}

function jsonSchemaWitness(schema: unknown, label: string): unknown {
  if (!isRecord(schema)) throw new Error(`${label} emitted a non-object JSON Schema`);
  if ('default' in schema) return schema.default;
  if ('const' in schema) return schema.const;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];
  for (const alternativeKey of ['anyOf', 'oneOf'] as const) {
    const alternatives = schema[alternativeKey];
    if (Array.isArray(alternatives) && alternatives.length > 0) {
      return jsonSchemaWitness(alternatives[0], `${label}.${alternativeKey}[0]`);
    }
  }

  switch (schema.type) {
    case 'object': {
      const properties = isRecord(schema.properties) ? schema.properties : {};
      const required = Array.isArray(schema.required)
        ? schema.required.filter((name): name is string => typeof name === 'string')
        : [];
      return Object.fromEntries(required.map((name) => [
        name,
        jsonSchemaWitness(properties[name], `${label}.${name}`),
      ]));
    }
    case 'integer':
    case 'number':
      if (typeof schema.minimum === 'number') return schema.minimum;
      if (typeof schema.exclusiveMinimum === 'number') return schema.exclusiveMinimum + 1;
      if (typeof schema.maximum === 'number') return schema.maximum;
      return 0;
    case 'string':
      if (schema.format === 'date-time') return '2026-01-01T00:00:00.000Z';
      return 'x'.repeat(typeof schema.minLength === 'number' ? Math.max(1, schema.minLength) : 1);
    case 'boolean':
      return false;
    case 'array': {
      const count = typeof schema.minItems === 'number' ? schema.minItems : 0;
      return Array.from({ length: count }, () => jsonSchemaWitness(schema.items, `${label}[]`));
    }
    case 'null':
      return null;
    default:
      throw new Error(`${label} emitted unsupported JSON Schema ${JSON.stringify(schema)}`);
  }
}

function isDerivableInputSchema(value: unknown): value is DerivableInputSchema {
  return isRecord(value) && typeof value.parse === 'function' &&
    typeof value.toJSONSchema === 'function';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
