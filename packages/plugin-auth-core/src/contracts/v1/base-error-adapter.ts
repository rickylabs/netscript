/**
 * Typed adapter from the shared plugin error vocabulary to oRPC contract errors.
 *
 * @module
 */

import type { AnySchema, ErrorMap } from '@orpc/contract';
import type { BasePluginErrorDefinition } from '@netscript/plugin/contract-base';

type ContractErrorDefinition = NonNullable<ErrorMap[keyof ErrorMap]>;

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return value !== null && typeof value === 'object';
}

function isStandardSchema(value: unknown): value is AnySchema {
  if (!isRecord(value) || !('~standard' in value)) {
    return false;
  }
  const standard = value['~standard'];
  return isRecord(standard) && standard.version === 1 && typeof standard.vendor === 'string' &&
    typeof standard.validate === 'function';
}

export function toContractErrorDefinition(
  definition: BasePluginErrorDefinition,
): ContractErrorDefinition {
  if (!isStandardSchema(definition.data)) {
    throw new TypeError('Base plugin error data must implement Standard Schema V1');
  }
  return {
    data: definition.data,
    message: definition.message,
    status: definition.status,
  };
}
