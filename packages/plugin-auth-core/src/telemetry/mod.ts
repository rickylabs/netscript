/**
 * Auth telemetry constants, redaction helpers, and instrumentation.
 *
 * @example
 * ```ts
 * import { AuthOutcome, createAuthTelemetry } from "@netscript/plugin-auth-core/telemetry";
 *
 * const telemetry = createAuthTelemetry({ subjectHashSalt: "deployment-owned-salt" });
 * await telemetry.traceOperation(
 *   { operation: "signin", backend: "kv-oauth", method: "GET" },
 *   async (recorder) => {
 *     await recorder.setOutcome({ outcome: AuthOutcome.SUCCESS });
 *     return true;
 *   },
 * );
 * ```
 *
 * @module
 */

export * from './attributes.ts';
export * from './redaction.ts';
export * from './instrumentation.ts';
