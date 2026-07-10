/** Canonical JSON, human, and exit-code rendering for runtime results. */

import { RUNTIME_SCHEMA_VERSION } from './contract.ts';
import type { RuntimeCommand, RuntimeResult } from './contract.ts';
import type { DesiredRuntimeState, ObservedRuntimeState } from './state.ts';
import {
  summarizeDesiredState,
  summarizeObservedState,
  unavailableObservedSummary,
} from './state.ts';

export const CANONICAL_EXIT_CODES = {
  success: 0,
  degraded: 2,
  invalidRequest: 3,
  blocked: 4,
  failure: 5,
} as const;

/** Builds the bounded canonical result shared by read, plan, and apply paths. */
export function buildRuntimeResult(
  command: RuntimeCommand,
  startedAt: string,
  completedAt: string,
  desired: DesiredRuntimeState | null,
  observed: ObservedRuntimeState | null,
  values: Pick<RuntimeResult, 'status' | 'changed' | 'actions' | 'diagnostics'>,
  checkpointId?: string,
): RuntimeResult {
  const elapsed = Date.parse(completedAt) - Date.parse(startedAt);
  const filter = command.kind === 'status' ? command : undefined;
  const route = 'route' in command
    ? command.route
    : command.kind === 'fallback'
    ? command.targetRoute
    : command.kind === 'restore'
    ? desired?.agents[command.session.agent]?.route
    : undefined;
  const agentFound = !filter?.agent || Boolean(
    desired?.agents[filter.agent] || observed?.auth.some((entry) => entry.agent === filter.agent) ||
      observed?.capabilities[filter.agent] ||
      observed?.sessions.some((entry) => entry.identity.agent === filter.agent),
  );
  const worktreeFound = !filter?.worktree || Boolean(
    desired?.worktrees.some((entry) => entry.path === filter.worktree) ||
      observed?.worktrees.some((entry) => entry.path === filter.worktree) ||
      observed?.sessions.some((entry) => entry.identity.worktree === filter.worktree),
  );
  const sessionFound = !filter?.sessionId || Boolean(
    desired?.sessions.some((entry) => entry.sessionId === filter.sessionId) ||
      observed?.sessions.some((entry) => entry.identity.sessionId === filter.sessionId),
  );
  const missing = !agentFound || !worktreeFound || !sessionFound;
  const diagnostics = missing
    ? [...values.diagnostics, {
      code: 'missing_identity' as const,
      category: 'input' as const,
      retryable: false,
      message: 'status filter matched no runtime identity',
    }]
    : values.diagnostics;
  return {
    schemaVersion: RUNTIME_SCHEMA_VERSION,
    commandId: command.commandId,
    command: command.kind,
    mode: command.mode,
    ...values,
    status: missing ? 'blocked' : values.status,
    diagnostics,
    desiredSummary: summarizeDesiredState(desired, filter),
    observedSummary: observed
      ? summarizeObservedState(observed, filter)
      : unavailableObservedSummary(),
    route,
    ...(checkpointId ? { checkpointId } : {}),
    timing: {
      startedAt,
      completedAt,
      durationMs: Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : 0,
    },
  };
}

/** Renders exactly one schema object and never includes data outside the result contract. */
export function renderRuntimeJson(result: RuntimeResult): string {
  return JSON.stringify(result, null, 2);
}

/** Renders bounded human diagnostics from the same canonical result object. */
export function renderRuntimeHuman(result: RuntimeResult): string {
  const lines = [
    `Agentic runtime ${result.command}: ${result.status} (schema ${result.schemaVersion})`,
    `mode: ${result.mode}; changed: ${result.changed ? 'yes' : 'no'}`,
    `desired state: ${result.desiredSummary?.stateId ?? 'none'}`,
    `observed state: ${result.observedSummary.stateId}`,
    `components: ${result.observedSummary.components.length}; sessions: ${result.observedSummary.sessions.length}`,
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
