/**
 * Deferred rendering primitives for `@netscript/fresh`.
 *
 * Keep these as direct re-exports so Fresh sees the original component and
 * island modules without facade indirection.
 *
 * @module
 */

export * from './DeferPage.tsx';
export * from './Deferred.tsx';
export * from './DeferIsland.tsx';
export * from './policy.ts';
export * from './telemetry.ts';
