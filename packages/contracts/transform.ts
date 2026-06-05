/**
 * Transform helpers for mapping storage records into public contract shapes.
 *
 * @example
 * ```typescript
 * import { createTransformer } from "@netscript/contracts/transform";
 *
 * const publicUser = createTransformer((user: UserRecord) => ({
 *   id: user.id,
 *   name: user.name,
 * }));
 * ```
 *
 * @module
 */

export * from './src/application/transform-helpers.ts';
