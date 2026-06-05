/**
 * @module @netscript/plugin-sagas-core
 *
 * Saga DSL, runtime ports, adapters, telemetry, configuration, and testing
 * primitives for NetScript saga plugins.
 *
 * The root surface is intentionally curated. Implementation slices add public
 * exports here only after their backing domain types and gates exist.
 */

export * from './src/public/mod.ts';
