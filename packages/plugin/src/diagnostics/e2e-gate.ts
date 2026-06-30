/**
 * Shared end-to-end gate metadata shape for NetScript plugins.
 *
 * Every plugin that contributes runtime E2E gates (workers, sagas, streams)
 * describes each gate with the same three fields: a stable `id`, a
 * human-readable `description`, and the `command` the evaluator or CLI E2E
 * runner executes. This module owns that single definition so each plugin's
 * `<kind>-gates.ts` only carries the kind-specific gate data, not a duplicated
 * interface.
 *
 * @module
 */

/**
 * Metadata describing one runtime end-to-end gate contributed by a plugin.
 *
 * The shape is intentionally minimal and convention-bearing: gate data arrays
 * live in each plugin, but the field contract is centralized here so the gate
 * registry and E2E runner can treat every plugin's gates uniformly.
 *
 * @example A plugin gate definition
 * ```ts
 * import type { PluginE2eGate } from "@netscript/plugin";
 *
 * const gate: PluginE2eGate = {
 *   id: "workers.health",
 *   description: "Workers API service exposes a healthy HTTP endpoint.",
 *   command: ["deno", "run", "--allow-net", "--allow-env", "src/e2e/probes/health.ts"],
 * };
 * ```
 */
export interface PluginE2eGate {
  /** Stable gate identifier. */
  readonly id: string;
  /** Human-readable gate summary. */
  readonly description: string;
  /** Command used by the evaluator or CLI E2E runner. */
  readonly command: readonly string[];
}
