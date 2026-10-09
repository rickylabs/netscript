/**
 * Key-based redaction policy for oRPC debug logging.
 *
 * @module
 */

import { SENSITIVE_FIELD_FRAGMENTS, SENSITIVE_RPC_FIELD_NAMES } from './constants.ts';

/** Placeholder written in place of a redacted value. */
export const REDACTED_VALUE = '[REDACTED]';

/** Decides which input keys are sensitive and masks their values. */
export interface FieldRedactor {
  /** Returns `true` when values stored under `key` must not be logged. */
  isSensitiveKey(key: string): boolean;
  /** Returns a copy of `value` with every sensitive key, at any depth, masked. */
  redact(value: unknown): unknown;
}

/**
 * Creates the redactor used by the oRPC logging plugin.
 *
 * Keys are compared case-insensitively. A key is sensitive when it contains one of the default
 * {@link SENSITIVE_FIELD_FRAGMENTS} or one of `extraFragments`, or when it equals one of the
 * exact {@link SENSITIVE_RPC_FIELD_NAMES}.
 *
 * @param extraFragments - Additional caller-supplied substring fragments.
 * @returns A redactor whose matching tables are built once.
 */
export function createFieldRedactor(extraFragments: readonly string[] = []): FieldRedactor {
  const fragments = [
    ...SENSITIVE_FIELD_FRAGMENTS,
    ...extraFragments.map((fragment) => fragment.trim().toLowerCase()).filter(Boolean),
  ];
  const exactNames: ReadonlySet<string> = new Set(SENSITIVE_RPC_FIELD_NAMES);

  const isSensitiveKey = (key: string): boolean => {
    const normalized = key.toLowerCase();
    return exactNames.has(normalized) ||
      fragments.some((fragment) => normalized.includes(fragment));
  };

  const redact = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(redact);
    }
    if (!value || typeof value !== 'object') {
      return value;
    }

    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = isSensitiveKey(key) ? REDACTED_VALUE : redact(entry);
    }
    return result;
  };

  return { isSensitiveKey, redact };
}
