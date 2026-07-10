/** Durable, pure quota fallback and restoration state transitions. */

import type { RouteIdentity, SessionIdentity } from './contract.ts';
import type { RoutingReasonCategory, RoutingSignal } from './routing-signal-classifier.ts';

export const ROUTING_PHASES = [
  'desired',
  'degraded',
  'fallback_active',
  'probe_due',
  'probe_failed',
  'restoration_ready',
  'restored',
  'blocked',
] as const;
export type RoutingPhase = typeof ROUTING_PHASES[number];

export const RESTORATION_STATUSES = [
  'not_required',
  'waiting_reset',
  'probing',
  'ready',
  'restored',
  'blocked',
] as const;
export type RestorationStatus = typeof RESTORATION_STATUSES[number];
export const ROUTING_CANARY_STATUSES = ['not_run', 'passed', 'failed'] as const;
export type RoutingCanaryStatus = typeof ROUTING_CANARY_STATUSES[number];
export const MAX_ROUTING_HISTORY = 32;
export const MAX_FALLBACK_DEPTH = 3;
export const PROBE_BACKOFF_MS: number = 5 * 60 * 1000;

export interface RoutingCanaryState {
  readonly status: RoutingCanaryStatus;
  readonly checkedAt?: string;
  readonly diagnosticCode?: string;
}

export interface RoutingTransition {
  readonly id: string;
  readonly from: RoutingPhase;
  readonly to: RoutingPhase;
  readonly reason: RoutingReasonCategory;
  readonly occurredAt: string;
  readonly sessionId: string;
  readonly fallbackDepth: number;
  readonly notificationRequired: boolean;
}

export interface RoutingState {
  readonly schemaVersion: '1.0';
  readonly routingStateId: string;
  readonly phase: RoutingPhase;
  readonly desiredRoute: RouteIdentity;
  readonly activeRoute: RouteIdentity;
  readonly reasonCategory: RoutingReasonCategory;
  readonly detectedAt: string;
  readonly resetAt?: string;
  readonly lastProbeAt?: string;
  readonly nextProbeAt?: string;
  readonly affectedSession: SessionIdentity;
  readonly fallbackDepth: number;
  readonly restorationStatus: RestorationStatus;
  readonly canary: RoutingCanaryState;
  readonly notificationRequired: boolean;
  readonly transitions: readonly RoutingTransition[];
}

function bounded(transitions: readonly RoutingTransition[]): readonly RoutingTransition[] {
  return transitions.slice(-MAX_ROUTING_HISTORY);
}
function transition(
  state: RoutingState,
  to: RoutingPhase,
  occurredAt: string,
  values: Partial<RoutingState>,
): RoutingState {
  const entry: RoutingTransition = {
    id: `${state.routingStateId}:${state.transitions.length + 1}:${to}`,
    from: state.phase,
    to,
    reason: state.reasonCategory,
    occurredAt,
    sessionId: state.affectedSession.sessionId,
    fallbackDepth: values.fallbackDepth ?? state.fallbackDepth,
    notificationRequired: values.notificationRequired ?? state.notificationRequired,
  };
  return { ...state, ...values, phase: to, transitions: bounded([...state.transitions, entry]) };
}

/** Records a detected structured or pinned-compatibility routing failure. */
export function detectRoutingFailure(
  routingStateId: string,
  desiredRoute: RouteIdentity,
  session: SessionIdentity,
  signal: RoutingSignal,
  detectedAt: string,
): RoutingState {
  const initial: RoutingState = {
    schemaVersion: '1.0',
    routingStateId,
    phase: 'desired',
    desiredRoute,
    activeRoute: desiredRoute,
    reasonCategory: signal.reason,
    detectedAt,
    ...(signal.resetAt ? { resetAt: signal.resetAt } : {}),
    affectedSession: session,
    fallbackDepth: 0,
    restorationStatus: signal.resetAt ? 'waiting_reset' : 'blocked',
    canary: { status: 'not_run' },
    notificationRequired: false,
    transitions: [],
  };
  return transition(initial, 'degraded', detectedAt, {});
}

/** Activates a selected fallback only at an idle or new boundary. */
export function activateFallback(
  state: RoutingState,
  route: RouteIdentity,
  occurredAt: string,
  notificationRequired: boolean,
): RoutingState {
  if (state.affectedSession.boundary === 'active' || state.fallbackDepth >= MAX_FALLBACK_DEPTH) {
    return transition(state, 'blocked', occurredAt, { restorationStatus: 'blocked' });
  }
  return transition(state, 'fallback_active', occurredAt, {
    activeRoute: route,
    fallbackDepth: state.fallbackDepth + 1,
    notificationRequired,
  });
}

/** Marks a reset-eligible state ready for one minimal canary. */
export function markProbeDue(state: RoutingState, now: string): RoutingState {
  if (!state.resetAt || Date.parse(now) < Date.parse(state.resetAt)) return state;
  if (state.nextProbeAt && Date.parse(now) < Date.parse(state.nextProbeAt)) return state;
  return transition(state, 'probe_due', now, { restorationStatus: 'probing' });
}

/** Records a bounded minimal canary result and backoff after failure. */
export function recordRoutingCanary(
  state: RoutingState,
  checkedAt: string,
  passed: boolean,
  diagnosticCode?: string,
): RoutingState {
  if (state.phase !== 'probe_due') return state;
  if (passed) {
    return transition(state, 'restoration_ready', checkedAt, {
      lastProbeAt: checkedAt,
      nextProbeAt: undefined,
      restorationStatus: 'ready',
      canary: { status: 'passed', checkedAt },
    });
  }
  return transition(state, 'probe_failed', checkedAt, {
    lastProbeAt: checkedAt,
    nextProbeAt: new Date(Date.parse(checkedAt) + PROBE_BACKOFF_MS).toISOString(),
    restorationStatus: 'waiting_reset',
    canary: { status: 'failed', checkedAt, ...(diagnosticCode ? { diagnosticCode } : {}) },
  });
}

/** Restores the desired route after a successful canary and at a fresh boundary. */
export function restoreDesiredRoute(
  state: RoutingState,
  session: SessionIdentity,
  occurredAt: string,
): RoutingState {
  if (
    session.boundary === 'active' || state.phase !== 'restoration_ready' ||
    state.canary.status !== 'passed'
  ) {
    return transition(state, 'blocked', occurredAt, { restorationStatus: 'blocked' });
  }
  return transition(state, 'restored', occurredAt, {
    activeRoute: state.desiredRoute,
    affectedSession: session,
    restorationStatus: 'restored',
    notificationRequired: state.activeRoute.mobileRequired !== state.desiredRoute.mobileRequired,
  });
}
