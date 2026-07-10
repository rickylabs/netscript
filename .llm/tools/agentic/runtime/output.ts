/** Canonical JSON, human, and exit-code rendering for runtime results. */

import type { RuntimeResult } from './contract.ts';

export const CANONICAL_EXIT_CODES = {
  success: 0,
  degraded: 2,
  invalidRequest: 3,
  blocked: 4,
  failure: 5,
} as const;

/** Renders exactly one schema object and never includes data outside the result contract. */
export function renderRuntimeJson(result: RuntimeResult): string {
  return JSON.stringify(result, null, 2);
}

/** Renders bounded human diagnostics from the same canonical result object. */
export function renderRuntimeHuman(result: RuntimeResult): string {
  const lines = [
    `Agentic runtime ${result.command}: ${result.status} (schema ${result.schemaVersion})`,
    `mode: ${result.mode}; changed: ${result.changed ? 'yes' : 'no'}`,
    `desired state: ${result.desiredStateId ?? 'none'}`,
    `observed state: ${result.observedStateId}`,
  ];
  for (const action of result.actions) {
    lines.push(
      `${
        action.status.toUpperCase().padEnd(11)
      } ${action.kind} via ${action.adapter} (${action.effect})`,
    );
  }
  for (const entry of result.diagnostics) {
    lines.push(
      `${entry.code.toUpperCase().padEnd(24)} ${entry.message}${
        entry.ownerIssue ? ` [#${entry.ownerIssue}]` : ''
      }`,
    );
  }
  return lines.join('\n');
}

/** Maps a canonical result to the stable process exit contract. */
export function runtimeExitCode(result: RuntimeResult): number {
  if (
    result.diagnostics.some((entry) =>
      entry.category === 'input' || entry.category === 'policy' || entry.code === 'auth_conflict'
    )
  ) return CANONICAL_EXIT_CODES.invalidRequest;
  if (result.status === 'blocked') return CANONICAL_EXIT_CODES.blocked;
  if (result.status === 'degraded') return CANONICAL_EXIT_CODES.degraded;
  if (result.status === 'failed' || result.status === 'partially_rolled_back') {
    return CANONICAL_EXIT_CODES.failure;
  }
  return CANONICAL_EXIT_CODES.success;
}
