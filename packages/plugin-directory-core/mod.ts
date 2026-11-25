/**
 * @module @netscript/plugin-directory-core
 *
 * Provider-neutral directory port, domain contracts, typed errors, and conformance testing kit
 * for NetScript directory adapters.
 *
 * @example Evaluate bounded membership through the directory port
 * ```ts
 * import {
 *   DirectoryUnsupported,
 *   type DirectoryPort,
 * } from '@netscript/plugin-directory-core';
 *
 * declare const directory: DirectoryPort;
 *
 * if (!directory.capabilities.has('transitive-membership')) {
 *   throw new DirectoryUnsupported(
 *     directory.name,
 *     'memberOfAny',
 *     'Transitive group matching is not enabled on this directory.',
 *   );
 * }
 *
 * const result = await directory.memberOfAny(
 *   {
 *     user: {
 *       directoryInstance: 'corp-example',
 *       immutableId: '20000000-0000-4000-8000-000000000001',
 *     },
 *     candidateGroupIds: ['10000000-0000-4000-8000-000000000002'],
 *   },
 *   { timeoutMs: 2_000 },
 * );
 * console.log(result.memberOf, result.evaluatedAt, result.consistency.source);
 * ```
 */

export * from './src/public/mod.ts';
