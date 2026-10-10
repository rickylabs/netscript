/**
 * Combine semantics for the `sum`/`min`/`max` atomic mutations.
 *
 * Shared by every adapter that evaluates combine mutations itself (memory,
 * Redis) so they agree with each other. Deno KV evaluates them natively.
 *
 * @module
 */

/** Atomic mutation kinds that combine an operand with the stored value. */
export type CombineMutationType = 'sum' | 'min' | 'max';

/**
 * Combine an operand with the currently stored value.
 *
 * A missing or non-`bigint` stored value is treated as absent: `sum` starts
 * from `0n`, and `min`/`max` take the operand.
 *
 * @param type - Combine mutation kind.
 * @param stored - Value currently stored under the key, if any.
 * @param operand - Mutation operand.
 * @returns The value to store.
 *
 * @example
 * ```ts
 * import { combineAtomicValue } from "./atomic-combine.ts";
 *
 * combineAtomicValue("sum", 5n, 3n); // 8n
 * combineAtomicValue("min", undefined, 3n); // 3n
 * ```
 */
export function combineAtomicValue(
  type: CombineMutationType,
  stored: unknown,
  operand: bigint,
): bigint {
  if (typeof stored !== 'bigint') {
    return operand;
  }

  switch (type) {
    case 'sum':
      return stored + operand;
    case 'min':
      return stored < operand ? stored : operand;
    case 'max':
      return stored > operand ? stored : operand;
  }
}
