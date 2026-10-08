import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { CommandCodec, CommandJsonLimits } from '../domain/codec.ts';
import type { CommandJson } from '../domain/values.ts';
import { canonicalCommandJson, validatedCommandJson } from './canonical-json.ts';

/**
 * Create a synchronous Standard Schema codec whose input and output are bounded I-JSON.
 *
 * Async validation is refused with a configuration diagnostic. Both directions validate
 * before and after schema processing; persisted values never bypass the schema. Validation
 * must preserve canonical JSON identity, so replay cannot apply a transformation twice.
 *
 * @example
 * ```ts
 * import { jsonCodec } from '@netscript/service/commands';
 * import { z } from 'zod';
 * const codec = jsonCodec(z.object({ id: z.string() }));
 * const value = codec.decode(codec.encode({ id: 'item-1' }));
 * ```
 */
export function jsonCodec<T>(
  schema: StandardSchemaV1<unknown, T>,
  options?: CommandJsonLimits,
): CommandCodec<T> {
  // Validate options eagerly, independently of caller-supplied schema behavior.
  validatedCommandJson(0, options);
  const bounds = Object.freeze({ ...options });
  function validate(value: unknown): T {
    const input = validatedCommandJson(value, bounds);
    const inputText = canonicalCommandJson(input, bounds);
    const result = schema['~standard'].validate(input);
    if (result instanceof Promise || ('then' in result && typeof result.then === 'function')) {
      void Promise.resolve(result).catch(() => {});
      throw new TypeError('[netscript.command.codec] synchronous schema validation required');
    }
    if (result.issues !== undefined) {
      throw new TypeError('[netscript.command.codec] schema validation failed');
    }
    const output = validatedCommandJson(result.value, bounds);
    if (inputText !== canonicalCommandJson(output, bounds)) {
      throw new TypeError('[netscript.command.codec] schema must preserve canonical JSON identity');
    }
    return result.value;
  }
  return Object.freeze({
    encode(value: T): CommandJson {
      return validatedCommandJson(validate(value), bounds);
    },
    decode(value: CommandJson): T {
      return validate(value);
    },
  });
}
