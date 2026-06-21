/**
 * @module @netscript/plugin-auth-core
 *
 * Auth plugin contracts, backend ports, stream schemas, config schemas, and
 * testing primitives for NetScript auth plugins.
 *
 * @example Use the contract-only root surface
 * ```ts
 * import { AUTH_SESSION_STATES, AuthConfigSchema } from "@netscript/plugin-auth-core";
 *
 * const config = AuthConfigSchema.parse({ backend: "kv-oauth" });
 * console.log(config.backend, AUTH_SESSION_STATES.active);
 * ```
 */

export * from './src/public/mod.ts';
