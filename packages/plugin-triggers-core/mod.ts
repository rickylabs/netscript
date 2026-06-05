/**
 * @module @netscript/plugin-triggers-core
 *
 * Handler-first trigger DSL, runtime ports, adapters, telemetry,
 * configuration, and testing primitives for NetScript trigger plugins.
 *
 * The root surface is intentionally curated. Implementation slices add public
 * exports here only after their backing domain types and gates exist.
 */

export * from './src/public/mod.ts';
