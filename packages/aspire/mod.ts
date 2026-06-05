/**
 * @module @netscript/aspire
 *
 * SDK-neutral Aspire diagnostics for NetScript plugin packages and TypeScript
 * AppHost generation.
 *
 * The root entrypoint exposes the diagnostic contract. Composition, config,
 * schema, type, adapter, and testing APIs live on typed subpaths:
 * `@netscript/aspire/application`, `@netscript/aspire/config`,
 * `@netscript/aspire/schema`, `@netscript/aspire/types`,
 * `@netscript/aspire/adapters`, and `@netscript/aspire/testing`.
 *
 * @example Inspect a generated AppHost path
 * ```ts
 * import { inspectAspire } from "@netscript/aspire";
 *
 * const report = inspectAspire("./dotnet/AppHost");
 * console.log(report.summary);
 * ```
 */

export { inspectAspire } from './src/diagnostics/inspect-aspire.ts';
export type {
  InspectableAspireBuilder,
  InspectableAspireResource,
  InspectionReport,
} from './src/diagnostics/inspect-aspire.ts';
